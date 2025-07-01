import { SearchBarView } from ".";
import { handleAutocomplete, hideSuggestions, showHistorySuggestions, updateSuggestionHighlight } from "./suggestion";

export default function (cmp: SearchBarView) {
    let selectedSuggestionIndex = -1;

    cmp.searchInput.addEventListener("keydown", (e) => {
        if (e.key === "ArrowLeft" || e.key === "ArrowRight") return;

        const items = Array.from(cmp.suggestionsList.querySelectorAll("li"));

        if (e.key === "ArrowDown") {
            e.preventDefault();
            if (items.length === 0) return;

            selectedSuggestionIndex = (selectedSuggestionIndex + 1) % items.length;
            updateSuggestionHighlight(items, selectedSuggestionIndex);
        }

        if (e.key === "ArrowUp") {
            e.preventDefault();
            if (items.length === 0) return;

            selectedSuggestionIndex = (selectedSuggestionIndex - 1 + items.length) % items.length;
            updateSuggestionHighlight(items, selectedSuggestionIndex);
        }

        if (e.key === "Enter") {
            if (selectedSuggestionIndex >= 0 && items[selectedSuggestionIndex]) {
                e.preventDefault();
                const selectedText = items[selectedSuggestionIndex].textContent?.replace(/X$/, "").trim();
                if (selectedText) {
                    cmp.searchInput.value = selectedText;
                    hideSuggestions(cmp);
                    cmp.search();
                }
            } else {
                cmp.search();
            }
        }

        // reset selection and show suggestions when user types
        if (["ArrowDown", "ArrowUp", "Enter"].includes(e.key) === false) {
            selectedSuggestionIndex = -1;
            updateSuggestionHighlight(items, -1);

            const query = cmp.searchInput.value.trim();
            handleAutocomplete(cmp, query);
        }
    });

    cmp.searchInput.addEventListener("focus", () => {
        if (cmp.searchInput.value) return;
        showHistorySuggestions(cmp);
    });
}