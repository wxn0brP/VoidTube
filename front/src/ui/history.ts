import { changeView } from ".";
import { mgl } from "#mgl";
import { $store } from "#store";
import { UiComponent } from "#types/ui";
import { HistoryEntry } from "#types/video";
import { clamp, formatTime, levenshtein, setTitle, updateQueryParam } from "#utils";
import metaControlView from "./metaControl";
import uiFunc from "./modal";
import playerView from "./player";
import { loadVideo } from "./player/status";
import { fetchHistory } from "#api/history";
import { fetchVQL } from "#api/index";
import navBarView from "./navBar";

class HistoryView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    searchInput: HTMLInputElement;

    render(history: HistoryEntry[]) {
        this.container.innerHTML = "";
        this.container.classList.toggle("fewItems", clamp(0, history.length, 3) > 0);

        if (!history.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No history</h1>`;
            this.searchInput.style.display = "none";
            return;
        } else {
            this.searchInput.style.display = "";
        }

        history
            .sort((a, b) => b.last - a.last)
            .forEach(entry => {
                const card = document.createElement("div");
                card.className = "historyCard";

                const dateRaw = entry.info.uploadDate;
                const date = dateRaw[6] + dateRaw[7] + "." + dateRaw[4] + dateRaw[5] + "." + dateRaw[0] + dateRaw[1] + dateRaw[2] + dateRaw[3];

                card.innerHTML = `
                    <div style="background-image: url(${entry.info.thumbnail})" class="img"></div>
                    <h3>${entry.info.title}</h3>
                    ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                    ${entry.info.views.toLocaleString()} views -
                    ${date}
                    <div class="btns">
                        <button button title="Remove" class="btn rm" data-id="rm">Remove</button>
                        <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `

                card.addEventListener("click", () => {
                    $store.playlistId.set("");
                    $store.playlist.set([]);
                    $store.playlistIndex.set(0);
                    updateQueryParam("p", undefined);
                    updateQueryParam("pi", undefined);
                    loadVideo(entry._id, !playerView.paused);
                });

                card.querySelector(`[data-id=rm]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const sure = await uiFunc.confirm("Are you sure? You can't undo this");
                    if (!sure) return;

                    fetchVQL(`user -history s._id = ${entry._id}`).then(() => {
                        this.loadHistory();
                    });
                });

                card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    metaControlView.toggleToPlayList(entry._id);
                });

                this.container.appendChild(card);
            });
    }

    public async loadHistory(limit: number = 0) {
        const history = await fetchHistory(limit);
        this.render(history);
        return history;
    }

    mount(): void {
        this.element = document.querySelector("#history-view");
        this.container = this.element.querySelector("#history-container")!;
        this.searchInput = document.querySelector("#history-search")!;
        this.searchInput.style.display = "none";

        $store.view.history.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.history.set(false);

        // quick load
        setTimeout(() => {
            this.loadHistory(128);
        }, 100);
        // load all history
        setTimeout(() => {
            this.loadHistory(); 
        }, window.location.search.length > 0 ? 7_000 : 2_000);

        this.searchInput.oninput = () => {
            const query = this.searchInput.value;
            this.filterSeeAll();
            if (!query) return;
            this.filter(query);
        }
    }

    show() {
        changeView("history");
        setTitle("");
        updateQueryParam("v", undefined);
        navBarView.save("history");
    }

    filterSeeAll() {
        const cards = this.container.querySelectorAll<HTMLDivElement>(".historyCard");
        cards.forEach(card => {
            card.style.display = "";
        });
    }

    filter(query: string) {
        const normalizedQuery = query.trim().toLowerCase();

        const cards = this.container.querySelectorAll<HTMLDivElement>(".historyCard");

        cards.forEach(card => {
            const title = card.querySelector("h3")!.textContent!.toLowerCase();

            const dist = levenshtein(normalizedQuery, title);
            const maxAllowed = Math.floor(title.length * 0.4);

            card.style.display = dist <= maxAllowed || title.includes(normalizedQuery) ? "" : "none";
        });
    }

}

const historyView = new HistoryView();
export default historyView;

mgl.historyShow = historyView.show;