import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import { UiComponent } from "#types/ui";
import { PlaylistEntry, RecommendationEntry } from "#types/video";
import { formatTime, updateQueryParam, setTitle } from "#utils";
import { changeView } from ".";
import metaControlView from "./metaControl";
import navBarView from "./navBar";
import playerView from "./player";
import { scrollToPlaylistElement } from "./player/audioSync";
import { loadVideo } from "./player/status";

class PlayListView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    recommendationsContainer: HTMLDivElement;

    render(playlist: PlaylistEntry[]) {
        this.container.innerHTML = "";
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

    renderRecommendations(videos: RecommendationEntry[]) {
        this.recommendationsContainer.innerHTML = "";
        videos.forEach(item => {
            const card = document.createElement("div");
            card.className = "videoCard";
            card.innerHTML = `
                <div style="background-image: url(${item.thumbnail})"></div>
                <h3>${item.title}</h3>
                ${formatTime(item.duration, null)}
                <button class="btn" data-id="play">Playlist 📂</button>
            `;
            card.addEventListener("click", () => {
                loadVideo(item._id);
            });
            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + item._id);
            });
            card.querySelector(`[data-id=play]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(item._id);
            });
            this.recommendationsContainer.appendChild(card);
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
        navBarView.save("video");
    }

    mount(): void {
        this.element = document.querySelector("#playlist");
        this.container = this.element.querySelector("#playlist-container")!;
        this.recommendationsContainer = this.element.querySelector("#recommendations")!;
    }
}

const playListView = new PlayListView();
export default playListView;