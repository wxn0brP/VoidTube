import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import { mgl } from "#mgl";
import { $store } from "#store";
import { SearchEntry } from "#types/video";
import navBarView from "#ui/navBar";
import metaControlView from "#ui/video/metaControl";
import { loadVideo } from "#ui/video/player/status";
import { fewItems, formatTime, numToLocale, clearQueryParams, updateQueryParam } from "#utils";
import channelView from "./channel";
import queuePanel from "#ui/video/queue";

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
            card.clA("card");

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3 title="${entry.title}">${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views
                <div class="author">
                    <img src="${"/avatarTry?id=" + entry.channel}" class="avatar">
                    <a href="/?channel=${entry.channel}">${entry.channelName}</a>
                </div>
                <div class="btns">
                    <button class="btn" data-id="queue">Queue➕</button>
                    <button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            card.addEventListener("click", () => {
                // TODO -
                // $store.playlistId.set("");
                // $store.playlist.set([]);
                // $store.playlistIndex.set(0);
                clearQueryParams();
                updateQueryParam("v", entry.id);
                loadVideo(entry.id);
            });

            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + entry.id);
            });

            card.querySelector(`.author`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                channelView.load(entry.channel);
            });

            card.querySelector(`[data-id=queue]`)!.addEventListener("click", (e: MouseEvent) => {
                e.stopPropagation();
                e.preventDefault();
                e.shiftKey ? queuePanel.appendToNext(entry.id) : queuePanel.append(entry.id);
            });

            card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(entry.id, e);
            });

            card.querySelector(`img`).addEventListener("error", () => {
                card.querySelector(`img`).style.display = "none";
            });

            this.container.appendChild(card);
        });
        this.container.classList.toggle("fewItems", search.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#search-view");
        this.container = this.element.querySelector("#search-container")!;

        uiHelpers.storeHide(this.element, $store.view.search);
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