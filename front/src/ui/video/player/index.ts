import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { changeView } from "#ui/index";
import { uiMsg } from "#ui/modal/message";
import navBarView from "#ui/navBar";
import { clearQueryParams, setTitle, updateQueryParam } from "#utils";
import utils, { UiComponent } from "@wxn0brp/flanker-ui";
import queuePanel from "../queue";
import { setupAudioSync } from "./audioSync";
import { setupBar } from "./bar";
import { setupChannelInfo } from "./channelInfo";
import { loadMediaSession, loadVideo } from "./status";
import { setUpSponsorBlock } from "./sync";

export class PlayerView implements UiComponent {
    public element: HTMLDivElement;
    public bar: HTMLDivElement;

    public lastUpdateTime = Date.now();
    public videoEl: HTMLVideoElement;
    public audioEl: HTMLAudioElement;
    public savedTime: number = 0;
    public paused: boolean = true;

    public controls!: {
        playPauseBtn: HTMLButtonElement;
        progressInput: HTMLInputElement;
        volumeInput: HTMLInputElement;
        fullscreenBtn: HTMLButtonElement;
    };

    // Buffered & played ranges
    public bufferedRange!: HTMLDivElement;
    public playedRange!: HTMLDivElement;
    public progressInput!: HTMLInputElement;
    public loopPlaylist: boolean = false;

    constructor() {
        this.audioEl = new Audio();
    }

    mount(): void {
        this.element = document.querySelector("#player")!;
        this.bar = document.querySelector("#player-bar")!;
        this.videoEl = this.element.querySelector("video")!;

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
                this.savedTime = this.videoEl.currentTime;
                this.videoEl.pause();
                this.audioEl.pause();

                this.videoEl.src = videoUrl;
                this.audioEl.src = audioUrl;

                this.videoEl.load();
                this.audioEl.load();

                loadMediaSession();
            } catch (err) {
                uiMsg("Failed to load video: " + err.message);
            }
        };

        $store.video.subscribe(video => {
            setTitle(video ? video.title : "");
        });

        this.videoEl.addEventListener("loadeddata", () => {
            this.videoEl.currentTime = this.savedTime;
            this.audioEl.currentTime = this.savedTime;

            if (!this.paused) this.videoEl.play();
        });

        const loadMediaDebounce = utils.debounce(loadMedia, 100);
        $store.selectedVideoUrl.subscribe(() => loadMediaDebounce());
        $store.selectedAudioUrl.subscribe(() => loadMediaDebounce());

        setupAudioSync();
        setupBar();
        setupChannelInfo();
        setUpSponsorBlock();

        window.addEventListener("beforeunload", () => {
            localStorage.setItem("cache.progress", JSON.stringify({ id: $store.videoId.get(), time: Math.floor(this.videoEl.currentTime) }));
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
mgl.player.setTime = (time: number) => playerView.videoEl.currentTime = time;