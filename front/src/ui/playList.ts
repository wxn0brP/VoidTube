import { fetchVQL } from "#api/index";
import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import { UiComponent } from "#types/ui";
import { PlaylistEntry, VideoInfo } from "#types/video";
import { formatTime, updateQueryParam, setTitle, clearQueryParams } from "#utils";
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
    recommendations: [string, HTMLSpanElement][] = [];

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

    renderRecommendations(videos: string[]) {
        this.recommendationsContainer.innerHTML = "";
        this.recommendations = [];
        const nextVideoId = $store.nextVideoId.get();

        videos.forEach(async (_id, i) => {
            const card = document.createElement("div");
            card.className = "videoCard";

            function html(item: Omit<VideoInfo, "formats">) {
                card.innerHTML = `
                    <div style="background-image: url(${item.thumbnail || "/favicon.svg"})"></div>
                    <h3>${item.title || "Loading..."}</h3>
                    ${formatTime(item.duration, null)}
                    <button class="btn" data-id="play-next-btn">
                        Play next
                        <span data-id="play-next">${_id === nextVideoId ? "✅" : "❌"}</span>
                    </button>
                    <button class="btn" data-id="playlist">Playlist 📂</button>
                `;

                card.addEventListener("click", () => {
                    loadVideo(_id);
                });
                card.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    window.open(window.location.origin + "/?v=" + _id);
                });
                card.querySelector(`[data-id=playlist]`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    metaControlView.toggleToPlayList(_id);
                });
                card.querySelector(`[data-id=play-next-btn]`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    $store.nextVideoId.set(_id);
                });

                const playNext = card.querySelector<HTMLSpanElement>("[data-id=play-next]");
                playListView.recommendations[i] = [_id, playNext];
            }
            this.recommendationsContainer.appendChild(card);
            html({} as any);
            setTimeout(() => fetchVQL(`api video-static! s._id = ${_id}`).then(html), i * 10);
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
        clearQueryParams();
        updateQueryParam("v", $store.videoId.get() || undefined);
        this.queryParams();
        navBarView.save("video");
    }

    public queryParams() {
        const playlistId = $store.playlistId.get();
        const playlistIndex = $store.playlistIndex.get();
        if (playlistId) updateQueryParam("p", playlistId);
        if (playlistIndex) updateQueryParam("pi", playlistIndex.toString());
    }

    mount(): void {
        this.element = document.querySelector("#playlist");
        this.container = this.element.querySelector("#playlist-container")!;
        this.recommendationsContainer = this.element.querySelector("#recommendations")!;

        $store.nextVideoId.subscribe(id => {
            this.recommendations.forEach(item => {
                if (!item || item.length < 2) return;
                item[1].innerHTML = id === item[0] ? "✅" : "❌";
            });
        });
    }
}

const playListView = new PlayListView();
export default playListView;