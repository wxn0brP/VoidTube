import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import { UiComponent } from "#types/ui";
import { PlaylistEntry } from "#types/video";
import { formatTime, updateQueryParam, setTitle } from "#utils";
import { changeView } from ".";
import playerView from "./player";
import { loadVideo } from "./player/status";

class PlayListView implements UiComponent {
    element: HTMLDivElement;

    render(playlist: PlaylistEntry[]) {
        this.element.innerHTML = "";
        playlist.forEach((item, i) => {
            const card = document.createElement("div");
            card.className = "videoCard";
            card.innerHTML = `
                <div style="background-image: url(${item.info.thumbnail})"></div>
                <h3>${item.info.title}</h3>
                ${formatTime(item.info.duration, null)}
            `;
            card.addEventListener("click", () => {
                $store.playlistIndex.set(i);
                loadVideo(item._id);
                updateQueryParam("pi", i.toString());
            });
            this.element.appendChild(card);
        });
    }

    public async loadPlaylist(id: string, index = 0) {
        this.show();
        $store.playlistId.set(id);
        $store.playlistIndex.set(index);
        const playlist = await fetchPlaylistInfo(id);
        this.render(playlist);

        if (!playlist.length) return;

        $store.playlist.set(playlist.map(item => item._id));

        const videoId = playlist[index]._id;
        $store.videoId.set(videoId);
        loadVideo(videoId, !playerView.paused, false);
        updateQueryParam("pi", index.toString());
    }

    public show() {
        changeView("video");
        setTitle($store.video.get()?.title);
        updateQueryParam("v", $store.videoId.get() || undefined);
        updateQueryParam("query", undefined);
        const playlistId = $store.playlistId.get();
        const playlistIndex = $store.playlistIndex.get();
        if(playlistId) updateQueryParam("p", playlistId);
        if(playlistIndex) updateQueryParam("pi", playlistIndex.toString());
    }

    mount(): void {
        this.element = document.querySelector("#playlist");
    }
}

const playListView = new PlayListView();
export default playListView;