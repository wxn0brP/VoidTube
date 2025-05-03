import { changeView } from ".";
import { fetchPlaylists } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { PlaylistsEntry } from "../types/video";
import { formatTime, updateQueryParam } from "../utils";
import playListView from "./playList";

class PlayListsView implements UiComponent {
    element: HTMLDivElement;

    render(playlist: PlaylistsEntry[]) {
        this.element.innerHTML = "";
        playlist.forEach((item) => {
            const card = document.createElement("div");
            card.className = "playlistCard";
            card.innerHTML = `
                <div style="background-image: url(${item.thumbnail})"></div>
                <h3>${item.name}</h3>
                ${item.videosCount} videos <br>
                Duration: ${formatTime(item.duration, null)}
            `;
            card.addEventListener("click", () => {
                playListView.loadPlaylist(item._id);
                playListView.show();
            });
            this.element.appendChild(card);
        });
    }

    async loadPlaylists() {
        const playlist = await fetchPlaylists();
        this.render(playlist);
    }

    mount(): void {
        this.element = document.querySelector("#playlists-view");

        $store.view.playlists.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.playlists.set(false);
        this.loadPlaylists();
    }

    show() {
        changeView("playlists");
        updateQueryParam("v", undefined);
        updateQueryParam("query", undefined);
    }
}

const playListsView = new PlayListsView();
export default playListsView;

(window as any).playlistsShow = playListsView.show;