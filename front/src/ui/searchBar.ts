import { searchVideo } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { clearQueryParams, getYouTubeVideoId, updateQueryParam } from "../utils";
import playerView from "./player";
import searchView from "./search";

class SearchBarView implements UiComponent {
    element: HTMLDivElement;

    public searchInput: HTMLInputElement;
    private searchBtn: HTMLButtonElement;
    public searchSizeInput: HTMLInputElement;

    mount(): void {
        this.element = document.querySelector("#search-bar");
        this.searchInput = this.element.querySelector("#search-input")!;
        this.searchBtn = this.element.querySelector("#search-btn")!;
        this.searchSizeInput = this.element.querySelector("#search-size")!;
        this.searchBtn.onclick = this.search.bind(this);
    }

    public async search() {
        const titleOrUrl = this.searchInput.value.trim();
        if (!titleOrUrl) {
            return;
        }

        if (titleOrUrl.startsWith("https://")) {
            const id = getYouTubeVideoId(titleOrUrl);
            updateQueryParam("v", id);
            playerView.loadVideo(id);
            return;
        }

        $store.loader.set(true);
        clearQueryParams();
        updateQueryParam("query", titleOrUrl);
        const size = Number(this.searchSizeInput.value) || 10;
        const searchResults = await searchVideo(titleOrUrl, size);
        $store.loader.set(false);
        searchView.show();
        searchView.render(searchResults);
    }
}

const searchBarView = new SearchBarView();
export default searchBarView;