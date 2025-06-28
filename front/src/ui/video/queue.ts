import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import { PlaylistEntry } from "#types/video";
import { loadVideo } from "#ui/video/player/status";
import { formatTime, getThumbnail, updateQueryParam } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { scrollToPlaylistElement } from "./player/sync";

class QueuePanel implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(playlist: PlaylistEntry[]) {
        this.container.innerHTML = "";
        playlist.forEach((item, i) => {
            const card = document.createElement("div");
            card.className = "videoCard card";
            card.innerHTML = `
                <div style="background-image: url(${getThumbnail(item.info.thumbnail, item._id)})"></div>
                <h3 title="${item.info.title}">${item.info.title}</h3>
                ${formatTime(item.info.duration, null)}
            `;
            card.addEventListener("click", () => {
                $store.playlistIndex.set(i);
                loadVideo(item._id);
                updateQueryParam("pi", i.toString());
            });
            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + item._id);
            });
            this.container.appendChild(card);
        });

        setTimeout(() => {
            scrollToPlaylistElement();
        }, 100);
    }

    public async loadPlaylist(id: string, index = 0) {
        $store.playlistId.set(id);
        $store.playlistIndex.set(index);

        const playlist = await fetchPlaylistInfo(id);
        this.render(playlist);

        if (!playlist.length) return;

        $store.playlist.set(playlist.map(item => item._id));
        const videoId = playlist[index]._id;
        $store.videoId.set(videoId);
        loadVideo(videoId, { saveProgressOpt: false });
        updateQueryParam("pi", index.toString());
    }

    public queryParams() {
        const playlistId = $store.playlistId.get();
        const playlistIndex = $store.playlistIndex.get();
        if (playlistId) updateQueryParam("p", playlistId);
        if (playlistIndex) updateQueryParam("pi", playlistIndex.toString());
    }

    mount(): void {
        this.element = document.querySelector("#queue-panel");
        this.container = this.element.querySelector("#queue-container")!;
    }
}

const queuePanel = new QueuePanel();
export default queuePanel;