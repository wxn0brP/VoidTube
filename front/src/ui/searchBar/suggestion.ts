import { levenshtein } from "#utils";
import { fetchVQL } from "@wxn0brp/vql-client";
import { SearchBarView } from ".";
import uiFunc from "#ui/modal";
import { $store } from "#store";
import { filterWithLevenshtein } from "./utils";

export function renderSuggestions(cmp: SearchBarView, suggestions: string[], fromHistory: string[] = []) {
    cmp.suggestionsList.innerHTML = "";
    cmp.suggestionsList.style.display = "";

    if (suggestions.length === 0 && fromHistory.length === 0) {
        hideSuggestions(cmp);
        return;
    }

    const allSuggestions = [...new Set([...suggestions, ...fromHistory])];

    const scoredSuggestions = allSuggestions.map(s => {
        return {
            s,
            score: levenshtein(s, cmp.searchInput.value),
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

                cmp.searchHistory = cmp.searchHistory.filter(h => h !== s);
                fetchVQL(`user -search-history s._id = "${s}"`, { silent: true });
                renderSuggestions(cmp, suggestions, fromHistory.filter(h => h !== s));
            });
        }

        li.addEventListener("click", () => {
            cmp.searchInput.value = s;
            hideSuggestions(cmp);
            cmp.search();
        });

        cmp.suggestionsList.appendChild(li);
    });
}

export function showHistorySuggestions(cmp: SearchBarView) {
    if (cmp.searchHistory.length === 0) {
        hideSuggestions(cmp);
        return;
    }

    const recent = cmp.searchHistory.slice(0, 10);
    renderSuggestions(cmp, [], recent);
}

export function hideSuggestions(cmp: SearchBarView) {
    cmp.suggestionsList.innerHTML = "";
    cmp.suggestionsList.style.display = "none";
}

export function updateSuggestionHighlight(items: Element[], index: number) {
    items.forEach((el, i) => {
        if (i === index) {
            el.classList.add("active");
            el.scrollIntoView({ block: "nearest" });
        } else {
            el.classList.remove("active");
        }
    });
}

export async function handleAutocomplete(cmp: SearchBarView, query: string) {
    if (!query) {
        showHistorySuggestions(cmp);
        return;
    }

    try {
        const q = `api suggestions s.q="${query}" s.hl = ${$store.settings.searchLanguage.get()} s.gl = ${$store.settings.searchCountry.get()}`;
        const apiSuggestions = await fetchVQL<string[]>(q, { silent: true });
        const historyMatches = filterWithLevenshtein(query, cmp.searchHistory, 7);
        const uniqueHistoryMatches = historyMatches.filter(
            (item) => !apiSuggestions.includes(item)
        );

        const finalSuggestions = [...apiSuggestions, ...uniqueHistoryMatches];

        renderSuggestions(cmp, finalSuggestions, uniqueHistoryMatches);
    } catch (e) {
        if ((e as DOMException).name !== "AbortError") {
            console.error("Error fetching suggestions:", e);
        }
        hideSuggestions(cmp);
    }
}