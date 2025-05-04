import { changeView } from "..";
import { $store } from "../../store";
import { UiComponent } from "../../types/ui";
import { debounce, updateQueryParam } from "../../utils";
import { setupAudioSync } from "./audioSync";
import { setupBar } from "./bar";

export class PlayerView implements UiComponent {
    public element: HTMLElement;
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

            if (!videoUrl || !audioUrl) return;

            try {
                this.savedTime = this.videoEl.currentTime;
                this.videoEl.pause();
                this.audioEl.pause();

                this.videoEl.src = videoUrl;
                this.audioEl.src = audioUrl;

                this.videoEl.load();
                this.audioEl.load();
            } catch (err) {
                alert("Failed to load video: " + err.message);
            }
        };

        this.videoEl.addEventListener("loadeddata", () => {
            this.videoEl.currentTime = this.savedTime;
            this.audioEl.currentTime = this.savedTime;

            if (!this.paused) this.videoEl.play();
        });

        const loadMediaDebounce = debounce(loadMedia, 100);
        $store.selectedVideoUrl.subscribe(() => loadMediaDebounce());
        $store.selectedAudioUrl.subscribe(() => loadMediaDebounce());

        setupAudioSync();
        setupBar();

        window.addEventListener("beforeunload", () => {
            localStorage.setItem("cache.progress", JSON.stringify({ id: $store.videoId.get(), time: Math.floor(this.videoEl.currentTime) }));
        });
    }

    public show() {
        changeView("video");
        updateQueryParam("v", $store.videoId.get());
        updateQueryParam("query", undefined);
    }
}

const playerView = new PlayerView();
export default playerView;

(window as any).playerShow = playerView.show;