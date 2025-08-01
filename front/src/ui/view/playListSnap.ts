import { fetchPlaylistSnap, fetchPlaylistSnapYouTube } from "#api/playlist";
import { $store } from "#store";
import { PlaylistSnapEntry } from "#types/video";
import { cardHelpers } from "#ui/helpers/card";
import { fewItems, formatTime, getThumbnail, number2HumanFormatter, numToLocale, setTitle, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";
import playListsModal from "#ui/modal/playlists";
import { fetchVQL } from "@wxn0brp/vql-client";
import playListsView from "./playListsView";
import { uiMsg } from "#ui/modal/message";

class PlayListSnapView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    ids: string[] = [];

    render(data: PlaylistSnapEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, data.length);
        this.ids = data.map(entry => entry._id);

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
                ${number2HumanFormatter.format(entry.info.views)} views
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
        this.element = qs("#playlist-snap")!;
        this.container = this.element.querySelector("#playlist-snap-container")!;
        uiHelpers.storeHide(this.element, $store.view.playlistSnap);
        $store.view.playlistSnap.set(false);

        this.element.querySelector("#save-snap-playlist").addEventListener("click", () => {
            this.saveTo();
        });
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

    async loadYoutubePlaylist(id: string) {
        const playlist = await fetchPlaylistSnapYouTube(id);
        this.render(playlist);
    }

    async saveTo() {
        if (!this.ids.length) {
            uiMsg("No available videos");
            return;
        }

        const playlist = await new Promise(r => {
            playListsModal.show({ callback: r });
        });
        if (!playlist) return;

        const ids = this.ids;
        for (let i = 0; i < ids.length; i++) {
            await fetchVQL(`playlist +${playlist} d._id = ${ids[i]}`);
        }
        await fetchVQL(`user ~playlist s._id=${playlist} u.last=$_nowShort`);
        await playListsView.loadPlaylists();
    }
}

const playListSnapView = new PlayListSnapView();
export default playListSnapView;