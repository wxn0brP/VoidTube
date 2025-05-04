import { changeView } from ".";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { SearchEntry } from "../types/video";
import { formatTime, updateQueryParam } from "../utils";
import playerView from "./player";
import { loadVideo } from "./player/status";

class SearchView implements UiComponent {
    element: HTMLElement;

    render(search: SearchEntry[]) {
        this.element.innerHTML = "";

        search.forEach(entry => {
            const card = document.createElement("div");
            card.className = "searchCard";

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3>${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${entry.views.toLocaleString()} views
            `

            card.addEventListener("click", () => {
                updateQueryParam("v", entry.id);
                updateQueryParam("query", undefined);
                loadVideo(entry.id, !playerView.paused);
            });

            this.element.appendChild(card);
        });
    }

    mount(): void {
        this.element = document.querySelector("#search-view");

        $store.view.search.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.search.set(false);
    }

    show() {
        changeView("search");
        updateQueryParam("v", undefined);
    }
}

const searchView = new SearchView();
export default searchView;

(window as any).searchShow = searchView.show;