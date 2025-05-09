import { fetchPlaylistSnap } from "#api/playlist";
import { $store } from "#store";
import { UiComponent } from "#types/ui";
import { PlaylistSnapEntry } from "#types/video";
import { clamp, formatTime, setTitle, updateQueryParam } from "#utils";
import { changeView } from ".";
import metaControlView from "./metaControl";
import navBarView from "./navBar";
import playerView from "./player";
import { loadVideo } from "./player/status";

class PlayListSnapView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(data: PlaylistSnapEntry[]) {
        this.container.innerHTML = "";
        this.container.classList.toggle("fewItems", clamp(0, data.length, 3) > 0);

        if (!data.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Videos</h1>`;
            return;
        }
        
        data.forEach(entry => {
            const card = document.createElement("div");
            card.className = "playlistSnapCard";
            card.innerHTML = `
                <div style="background-image: url(${entry.info.thumbnail})" class="img"></div>
                <h3>${entry.info.title}</h3>
                ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                ${entry.info.views.toLocaleString()} views -
                <div class="btns">
                    <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `;

            card.addEventListener("click", () => {
                $store.playlistId.set("");
                $store.playlist.set([]);
                $store.playlistIndex.set(0);
                updateQueryParam("p", undefined);
                updateQueryParam("pi", undefined);
                loadVideo(entry._id, !playerView.paused);
            });

            card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(entry._id);
            });

            this.container.appendChild(card);
        });

        this.container.classList.toggle("fewItems", data.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#playlist-snap")!;
        this.container = this.element.querySelector("#playlist-snap-container")!;

        $store.view.playlistSnap.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

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