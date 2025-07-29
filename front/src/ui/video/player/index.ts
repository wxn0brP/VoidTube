import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { changeView } from "#ui/index";
import { uiMsg } from "#ui/modal/message";
import navBarView from "#ui/navBar";
import { clearQueryParams, setTitle, updateQueryParam } from "#utils";
import utils, { UiComponent } from "@wxn0brp/flanker-ui";
import queuePanel from "../queue";
import { setupBar } from "./bar";
import { setupChannelInfo } from "./channelInfo";
import { loadMediaSession, loadVideo } from "./status";
import { setUpSponsorBlock } from "./sync";
import { loadCaps, removeCaps } from "./caps";
import MediaSyncController from "./mediaSync";

export class PlayerView implements UiComponent {
	public element: HTMLDivElement;
	public bar: HTMLDivElement;

	public lastUpdateTime = Date.now();
	public videoEl: HTMLVideoElement;
	public audioEl: HTMLAudioElement;
	public savedTime: number = 0;
	public mediaSync: MediaSyncController;

    constructor() {
        this.audioEl = new Audio();
    }

    mount(): void {
        this.element = document.querySelector("#player")!;
        this.bar = document.querySelector("#player-bar")!;
        this.videoEl = this.element.querySelector("video")!;

        this.mediaSync = new MediaSyncController({
            audio: this.audioEl,
            video: this.videoEl,
        });

        this.videoEl.controls = false;
        this.element.appendChild(this.videoEl);
        this.element.appendChild(this.bar);

        const loadMedia = async () => {
            const videoUrl = $store.selectedVideoUrl.get();
            const audioUrl = $store.selectedAudioUrl.get();

            if (!videoUrl || !audioUrl) {
                console.error("No video or audio url", videoUrl, audioUrl);
                fetchVQL("cache -video-dynamic! s._id = " + $store.videoId.get()).then(() => {
                    loadVideo($store.videoId.get());
                    setTimeout(() => {
                        uiMsg("Failed to load video. Trying again...");
                    }, 100);
                });
                return;
            }

            try {
                this.savedTime = this.mediaSync.currentTime;
                const isPlaying = this.mediaSync.isPlaying;
                this.mediaSync.pause();

                this.videoEl.src = videoUrl;
                this.audioEl.src = audioUrl;

                this.videoEl.load();
                this.audioEl.load();

                loadMediaSession();

                if (isPlaying) this.mediaSync.play();
            } catch (err) {
                uiMsg("Failed to load video: " + err.message);
            }
        };

        $store.video.subscribe(video => {
            setTitle(video ? video.title : "");
        });

        this.mediaSync.eventEmitter.on("loadeddata", () => {
            this.mediaSync.seek(this.savedTime);
            loadMediaSession();

            if (this.mediaSync.isPlaying) this.mediaSync.play();
        });

        const loadMediaDebounce = utils.debounce(loadMedia, 100);
        $store.selectedVideoUrl.subscribe(() => loadMediaDebounce());
        $store.selectedAudioUrl.subscribe(() => loadMediaDebounce());

        setupBar();
        setupChannelInfo();
        setUpSponsorBlock();

        window.addEventListener("beforeunload", () => {
            localStorage.setItem("cache.progress", JSON.stringify({
                id: $store.videoId.get(),
                time: Math.floor(this.mediaSync.currentTime)
            }));
            localStorage.setItem("cache.queue", JSON.stringify({
                i: $store.queueIndex.get(),
                q: queuePanel.queue
            }));
            localStorage.setItem("cache.queueName", $store.queueGroup.get());
        });
    }

    public show() {
        if (!$store.videoId.get()) return;
        changeView("video");
        setTitle($store.video.get()?.title);
        clearQueryParams();
        updateQueryParam("v", $store.videoId.get());
        queuePanel.queryParams();
        navBarView.save("video");
    }
}

const playerView = new PlayerView();
export default playerView;

mgl.playerShow = playerView.show;
mgl.player = {}
mgl.player.setTime = (time: number) => playerView.mediaSync.seek(time);
mgl.player.loadCaps = loadCaps;
mgl.player.removeCaps = removeCaps;
mgl.player.view = playerView;