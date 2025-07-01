import { mgl } from "#mgl";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { search } from "./search";
import { hideSuggestions } from "./suggestion";
import { loadSearchHistory } from "./utils";
import event from "./event";

export class SearchBarView implements UiComponent {
    element: HTMLDivElement;

    public searchInput: HTMLInputElement;
    public searchBtn: HTMLButtonElement;
    public searchSizeInput: HTMLInputElement;
    public suggestionsList: HTMLElement;
    public searchHistory: string[] = [];

    mount(): void {
        this.element = document.querySelector("#search-bar");
        this.searchInput = this.element.querySelector("#search-input")!;
        this.searchBtn = this.element.querySelector("#search-btn")!;
        this.searchSizeInput = this.element.querySelector("#search-size")!;
        this.suggestionsList = document.getElementById("suggestions")!;

        this.searchBtn.onclick = this.search.bind(this);

        document.addEventListener("click", (e) => {
            const target = e.target as HTMLElement;
            if (target.closest("#search-bar") || target.closest("#prompt")) return;
            hideSuggestions(this);
        });

        event(this);
        loadSearchHistory(this);
    }

    search() {
        search(this);
    }
}

const searchBarView = new SearchBarView();
export default searchBarView;

mgl.searchShow = (text: string, e: Event) => {
    e.preventDefault();
    searchBarView.searchInput.value = text;
    searchBarView.search();
};