import { searchVideo } from "#api/video";
import { $store } from "#store";
import { clearQueryParams, getYouTubeVideoId, levenshtein, setTitle, updateQueryParam } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { fetchVQL } from "@wxn0brp/vql-client";
import uiFunc from "./modal";
import { loadVideo } from "./video/player/status";
import searchView from "./view/search";
import { mgl } from "#mgl";

class SearchBarView implements UiComponent {
    element: HTMLDivElement;

    public searchInput: HTMLInputElement;
    private searchBtn: HTMLButtonElement;
    public searchSizeInput: HTMLInputElement;
    private suggestionsList: HTMLElement;
    private searchHistory: string[] = [];

    mount(): void {
        this.element = document.querySelector("#search-bar");
        this.searchInput = this.element.querySelector("#search-input")!;
        this.searchBtn = this.element.querySelector("#search-btn")!;
        this.searchSizeInput = this.element.querySelector("#search-size")!;
        this.suggestionsList = document.getElementById("suggestions")!;

        this.searchBtn.onclick = this.search.bind(this);
        let selectedSuggestionIndex = -1;

        this.searchInput.addEventListener("keydown", (e) => {
            if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;

            const items = Array.from(this.suggestionsList.querySelectorAll("li"));

            if (e.key === "ArrowDown") {
                e.preventDefault();
                if (items.length === 0) return;

                selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
                this.updateSuggestionHighlight(items, selectedSuggestionIndex);
            }

            if (e.key === "ArrowUp") {
                e.preventDefault();
                if (items.length === 0) return;

                selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
                this.updateSuggestionHighlight(items, selectedSuggestionIndex);
            }

            if (e.key === "Enter") {
                if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
                    e.preventDefault();
                    const selectedText = items[selectedSuggestionIndex].textContent?.replace(/X$/, "").trim();
                    if (selectedText) {
                        this.searchInput.value = selectedText;
                        this.hideSuggestions();
                        this.search();
                    }
                } else {
                    this.search();
                }
            }

            // reset selection and show suggestions when user types
            if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key) === false) {
                selectedSuggestionIndex = -1;
                this.updateSuggestionHighlight(items, -1);

                const query = this.searchInput.value.trim();
                this.handleAutocomplete(query);
            }
        });

        this.searchInput.addEventListener("focus", () => {
            if (this.searchInput.value) return;
            this.showHistorySuggestions();
        });

        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("#search-bar") || target.closest("#prompt")) return;
            this.hideSuggestions();
        });

        this.loadSearchHistory();
    }

    public async search() {
        const titleOrUrl = this.searchInput.value.trim();
        if (!titleOrUrl) return;
        this.hideSuggestions();

        if (titleOrUrl.startsWith("https://")) {
            const id = getYouTubeVideoId(titleOrUrl);
            updateQueryParam("v", id);
            loadVideo(id);
            return;
        }

        clearQueryParams();
        updateQueryParam("query", titleOrUrl);
        setTitle(titleOrUrl);

        const size = Number(this.searchSizeInput.value) || 10;
        const searchResults = await searchVideo(titleOrUrl, size);
        searchView.show();
        searchView.render(searchResults);
        this.saveSearchHistory(titleOrUrl);

        const index = this.searchHistory.indexOf(titleOrUrl);
        if (index >= 0)
            this.searchHistory.splice(index, 1);
        this.searchHistory.unshift(titleOrUrl);
    }

    private async handleAutocomplete(query: string): Promise<void> {
        if (!query) {
            this.showHistorySuggestions();
            return;
        }

        try {
            const q = `api suggestions s.q="${query}" s.hl = ${$store.settings.searchLanguage.get()} s.gl = ${$store.settings.searchCountry.get()}`;
            const apiSuggestions = await fetchVQL<string[]>(q, { silent: true });
            const historyMatches = filterWithLevenshtein(query, this.searchHistory, 7);
            const uniqueHistoryMatches = historyMatches.filter(
                (item) => !apiSuggestions.includes(item)
            );

            const finalSuggestions = [...apiSuggestions, ...uniqueHistoryMatches];

            this.renderSuggestions(finalSuggestions, uniqueHistoryMatches);
        } catch (e) {
            if ((e as DOMException).name !== "AbortError") {
                console.error("Error fetching suggestions:", e);
            }
            this.hideSuggestions();
        }
    }

    private renderSuggestions(suggestions: string[], fromHistory: string[] = []): void {
        this.suggestionsList.innerHTML = "";
        this.suggestionsList.style.display = "";

        if (suggestions.length === 0 && fromHistory.length === 0) {
            this.hideSuggestions();
            return;
        }

        const allSuggestions = [...new Set([...suggestions, ...fromHistory])];

        const scoredSuggestions = allSuggestions.map(s => {
            return {
                s,
                score: levenshtein(s, this.searchInput.value),
            };
        }).sort((a, b) => a.score - b.score).map(d => d.s);

        scoredSuggestions.slice(0, 20).forEach((s: string) => {
            const li = document.createElement("li");
            li.textContent = s;

            if (fromHistory.includes(s)) {
                const remove = document.createElement("span");
                remove.textContent = "X";
                li.appendChild(remove);
                remove.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const confirm = await uiFunc.confirm("Are you sure you want to remove this search from history?");
                    if (!confirm) return;

                    this.searchHistory = this.searchHistory.filter(h => h !== s);
                    fetchVQL(`user -search-history s._id = "${s}"`, { silent: true });
                    this.renderSuggestions(suggestions, fromHistory.filter(h => h !== s));
                });
            }

            li.addEventListener("click", () => {
                this.searchInput.value = s;
                this.hideSuggestions();
                this.search();
            });

            this.suggestionsList.appendChild(li);
        });
    }

    private showHistorySuggestions(): void {
        if (this.searchHistory.length === 0) {
            this.hideSuggestions();
            return;
        }

        const recent = this.searchHistory.slice(0, 10);
        this.renderSuggestions([], recent);
    }

    hideSuggestions() {
        this.suggestionsList.innerHTML = "";
        this.suggestionsList.style.display = "none";
    }

    private updateSuggestionHighlight(items: Element[], index: number) {
        items.forEach((el, i) => {
            if (i === index) {
                el.classList.add("active");
                el.scrollIntoView({ block: "nearest" });
            } else {
                el.classList.remove("active");
            }
        });
    }

    async loadSearchHistory() {
        const history = await fetchVQL<{ _id: string, last: number }[]>("user search-history");
        this.searchHistory = history.sort((a, b) => b.last - a.last).map(d => d._id);
    }

    async saveSearchHistory(data = this.searchInput.value) {
        await fetchVQL(`user updateOneOrAdd search-history s._id = "${data}" u.last = ${Math.floor(Date.now() / 1000)}`, { silent: true });
    }
}

function filterWithLevenshtein(query: string, list: string[], maxDistance: number): string[] {
    const lowerQuery = query.toLowerCase();
    return list
        .map(item => ({
            item,
            distance: levenshtein(lowerQuery, item.toLowerCase())
        }))
        .filter(({ distance }) => distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(({ item }) => item);
}

const searchBarView = new SearchBarView();
export default searchBarView;

mgl.searchShow = (text: string, e: Event) => {
    e.preventDefault();
    searchBarView.searchInput.value = text;
    searchBarView.search();
};