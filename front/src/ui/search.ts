import { changeView } from ".";
import { mgl } from "../mgl";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { SearchEntry } from "../types/video";
import { clamp, fewItems, formatTime, updateQueryParam } from "../utils";
import metaControlView from "./metaControl";
import navBarView from "./navBar";
import playerView from "./player";
import { loadVideo } from "./player/status";

class SearchView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(search: SearchEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, search.length);

        if (!search.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Results</h1>`;
            return;
        }

        search.forEach(entry => {
            const card = document.createElement("div");
            card.className = "searchCard";

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3>${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${entry.views.toLocaleString()} views
                <div class="btns">
                    <button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            card.addEventListener("click", () => {
                $store.playlistId.set("");
                $store.playlist.set([]);
                $store.playlistIndex.set(0);
                updateQueryParam("v", entry.id);
                updateQueryParam("query", undefined);
                updateQueryParam("p", undefined);
                updateQueryParam("pi", undefined);
                loadVideo(entry.id, !playerView.paused);
            });

            card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(entry.id);
            });

            this.container.appendChild(card);
        });
        this.container.classList.toggle("fewItems", search.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#search-view");
        this.container = this.element.querySelector("#search-container")!;

        $store.view.search.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.search.set(false);
    }

    show() {
        changeView("search");
        updateQueryParam("v", undefined);
        navBarView.save("search");
    }
}

const searchView = new SearchView();
export default searchView;

mgl.searchShow = searchView.show;