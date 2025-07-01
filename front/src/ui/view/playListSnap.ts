import { fetchPlaylistSnap } from "#api/playlist";
import { $store } from "#store";
import { PlaylistSnapEntry } from "#types/video";
import { cardHelpers } from "#ui/helpers/card";
import { fewItems, formatTime, getThumbnail, numToLocale, setTitle, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";

class PlayListSnapView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(data: PlaylistSnapEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, data.length);

        if (!data.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Videos</h1>`;
            return;
        }

        data.forEach(entry => {
            const card = document.createElement("div");
            card.className = "playlistSnapCard";
            card.clA("card");
            card.innerHTML = `
                <div style="background-image: url(${getThumbnail(entry.info.thumbnail, entry._id)})" class="img"></div>
                <h3 title="${entry.info.title}">${entry.info.title}</h3>
                ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                ${numToLocale(entry.info.views)} views -
                <div class="btns">
                    <button class="btn" data-id="queue">Queue➕</button>
                    <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `;

            cardHelpers.click(card, entry);
            cardHelpers.queue(card, entry);
            cardHelpers.playlist(card, entry);

            this.container.appendChild(card);
        });

        this.container.classList.toggle("fewItems", data.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#playlist-snap")!;
        this.container = this.element.querySelector("#playlist-snap-container")!;
        uiHelpers.storeHide(this.element, $store.view.playlistSnap);
        $store.view.playlistSnap.set(false);
    }

    show() {
        changeView("playlistSnap");
        setTitle("");
        updateQueryParam("v", undefined);
        updateQueryParam("query", undefined);
        navBarView.save("playlistSnap");
    }

    async loadPlaylist(id: string) {
        const playlist = await fetchPlaylistSnap(id);
        this.render(playlist);
    }
}

const playListSnapView = new PlayListSnapView();
export default playListSnapView;