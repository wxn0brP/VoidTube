import { changeView } from ".";
import { fetchVideoHistoryTime, fetchVideoInfo, markVideoAsWatched, updateVideoHistoryTime } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { debounce, formatTime, updateQueryParam } from "../utils";
import historyView from "./history";

let lastUpdateTime = Date.now();

export class PlayerView implements UiComponent {
    element: HTMLElement;
    bar: HTMLDivElement;

    public videoEl: HTMLVideoElement;
    public audioEl: HTMLAudioElement;
    public savedTime: number = 0;
    public paused: boolean = true;

    private controls!: {
        playPauseBtn: HTMLButtonElement;
        progressInput: HTMLInputElement;
        volumeInput: HTMLInputElement;
        fullscreenBtn: HTMLButtonElement;
    };

    // Buffered & played ranges
    private bufferedRange!: HTMLDivElement;
    private playedRange!: HTMLDivElement;
    private progressInput!: HTMLInputElement;
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

        this.setupAudioSync();
        this.setupBar();

        window.addEventListener("beforeunload", () => {
            localStorage.setItem("cache.progress", JSON.stringify({ id: $store.videoId.get(), time: Math.floor(this.videoEl.currentTime) }));
        });
    }

    setupAudioSync(): void {
        this.videoEl.addEventListener("play", () => {
            this.audioEl.currentTime = this.videoEl.currentTime;
            this.audioEl.play().catch(err => console.error("Audio play error:", err));
            this.paused = false;
        });

        this.videoEl.addEventListener("pause", () => {
            this.audioEl.pause();
            this.paused = true;
        });

        this.videoEl.addEventListener("seeking", () => {
            this.audioEl.currentTime = this.videoEl.currentTime;
        });

        this.videoEl.addEventListener("volumechange", () => {
            this.audioEl.volume = this.videoEl.volume;
            this.controls.volumeInput.value = this.videoEl.volume.toString();
        });
    }

    private changePlay(): void {
        this.paused = !this.paused;
        this.paused ? this.videoEl.pause() : this.videoEl.play();
        this.controls.playPauseBtn.textContent = this.paused ? "▶️" : "⏸️";
    }

    setupBar(): void {
        let hasHours = false;
        const playPauseBtn = this.bar.querySelector(".play-pause-btn") as HTMLButtonElement;
        const timeSpan = this.bar.querySelector(".time") as HTMLSpanElement;

        this.bufferedRange = this.bar.querySelector(".buffered-range")!;
        this.playedRange = this.bar.querySelector(".played-range")!;
        this.progressInput = this.bar.querySelector(".progress") as HTMLInputElement;

        const volume = this.bar.querySelector(".volume") as HTMLInputElement;
        const fullscreenBtn = this.bar.querySelector(".fullscreen-btn") as HTMLButtonElement;
        const loopPlaylist = this.bar.querySelector("#loopPlaylist") as HTMLInputElement;
        this.loopPlaylist = loopPlaylist.checked;

        this.controls = {
            playPauseBtn,
            progressInput: this.progressInput,
            volumeInput: volume,
            fullscreenBtn
        };

        playPauseBtn.addEventListener("click", this.changePlay.bind(this));
        this.videoEl.addEventListener("click", this.changePlay.bind(this));
        loopPlaylist.addEventListener("change", () => {
            this.loopPlaylist = loopPlaylist.checked;
        })

        document.addEventListener("keydown", (e) => {
            if (e.code === "Escape") {
                document.exitFullscreen();
                this.element.classList.remove("fullscreen");
                this.bar.classList.remove("fullscreen");
            }

            if (e.target instanceof HTMLInputElement) return;

            if (e.code === "Space") {
                e.preventDefault();
                this.changePlay();
            }

            if (e.key === "f") {
                this.toggleFullscreen();
            }

            if (e.code === "ArrowRight") {
                const time = Math.min(this.videoEl.duration, this.videoEl.currentTime + 5);
                this.videoEl.currentTime = this.audioEl.currentTime = time;
            }

            if (e.code === "ArrowLeft") {
                const time = Math.max(0, this.videoEl.currentTime - 5);
                this.videoEl.currentTime = this.audioEl.currentTime = time;
            }

            if (e.code === "ArrowUp") {
                const vol = Math.min(1, this.videoEl.volume + 0.05);
                this.videoEl.volume = this.audioEl.volume = vol;
                e.preventDefault();
            }
            
            if (e.code === "ArrowDown") {
                const vol = Math.max(0, this.videoEl.volume - 0.05);
                this.videoEl.volume = this.audioEl.volume = vol;
                e.preventDefault();
            }
        });

        let full_timeout: NodeJS.Timeout;
        document.addEventListener("mousemove", () => {
            if (!this.element.classList.contains("fullscreen")) return;
            clearTimeout(full_timeout);

            this.bar.style.opacity = "1";
            this.videoEl.style.cursor = "";
            full_timeout = setTimeout(() => {
                this.bar.style.opacity = "";
                if (this.element.classList.contains("fullscreen"))
                    setTimeout(() => { this.videoEl.style.cursor = "none"; }, 1000);
            }, 2000);
        });

        this.progressInput.addEventListener("input", () => {
            const duration = this.videoEl.duration;
            if (!isNaN(duration)) {
                const newTime = parseFloat(this.progressInput.value);
                this.videoEl.currentTime = newTime;
                this.audioEl.currentTime = newTime;
            }
        });

        volume.addEventListener("input", () => {
            const vol = parseFloat(volume.value);
            this.videoEl.volume = vol;
            this.audioEl.volume = vol;
        });

        fullscreenBtn.addEventListener("click", this.toggleFullscreen.bind(this));

        this.bar.querySelector<HTMLInputElement>("#loop")!.addEventListener("change", (e) => {
            const loop = (e.target as any).checked;
            this.videoEl.loop = loop;
        });

        setTimeout(() => {
            const loop = this.bar.querySelector<HTMLInputElement>("#loop")!.checked;
            this.videoEl.loop = loop;
        }, 100);

        // UI sync
        this.videoEl.addEventListener("loadedmetadata", () => {
            this.progressInput.max = this.videoEl.duration.toString();
            hasHours = this.videoEl.duration >= 3600;
            this.updateProgressBars();
        });

        const playNext = debounce(() => {
            const oldId = $store.videoId.get();
            setTimeout(() => {
                updateVideoHistoryTime(oldId, 0);
            }, 3000);

            const playlist = $store.playlist.get();
            const playlistIndex = $store.playlistIndex.get() || 0;
            let nextIndex = playlistIndex + 1;
            if (nextIndex >= playlist.length) {
                if (this.loopPlaylist) {
                    nextIndex = 0;
                } else return;
            }

            const nextVideoId = playlist[nextIndex];
            if (!nextVideoId) return;
            this.loadVideo(nextVideoId, true);
            $store.playlistIndex.set(nextIndex);
            updateQueryParam("pi", (nextIndex).toString());
        });

        this.videoEl.addEventListener("progress", () => this.updateProgressBars());
        this.videoEl.addEventListener("timeupdate", () => {
            this.updateProgressBars();
            timeSpan.textContent =
                formatTime(this.videoEl.currentTime, hasHours) + " / " +
                formatTime(this.videoEl.duration, hasHours);

            if (lastUpdateTime + 10_000 < Date.now()) {
                lastUpdateTime = Date.now();
                updateVideoHistoryTime($store.videoId.get(), Math.floor(this.videoEl.currentTime));
            }

            // if video was watched of last 3 seconds then start from the beginning
            if (Math.floor(this.videoEl.currentTime) + 3 >= Math.floor(this.videoEl.duration)) {
                updateVideoHistoryTime($store.videoId.get(), 0);
            }

            if (this.videoEl.currentTime + 0.1 >= this.videoEl.duration && !this.videoEl.loop) {
                playNext();
            }
        });

        this.videoEl.addEventListener("play", () => {
            playPauseBtn.textContent = "⏸️";
            this.paused = false;
        });

        this.videoEl.addEventListener("pause", () => {
            playPauseBtn.textContent = "▶️";
            this.paused = true;
        });
    }

    private toggleFullscreen(): void {
        this.element.classList.contains("fullscreen") ? document.exitFullscreen() : this.element.requestFullscreen();
        this.element.classList.toggle("fullscreen");
        this.bar.classList.toggle("fullscreen");
    }

    private updateProgressBars(): void {
        const duration = this.videoEl.duration;
        const currentTime = this.videoEl.currentTime;

        if (isNaN(duration) || duration === Infinity) return;

        // Played part
        const playedPercent = (currentTime / duration) * 100;
        this.progressInput.value = currentTime.toString();
        this.playedRange.style.width = `${playedPercent}%`;

        // Buffered parts
        const buffered = this.videoEl.buffered;
        if (buffered.length > 0) {
            let totalBuffered = 0;
            for (let i = 0; i < buffered.length; i++) {
                totalBuffered = Math.max(totalBuffered, buffered.end(i));
            }
            const bufferedPercent = (totalBuffered / duration) * 100;
            this.bufferedRange.style.width = `${bufferedPercent}%`;
        }
    }

    public async saveProgress() {
        lastUpdateTime = Date.now();
        await updateVideoHistoryTime(
            $store.videoId.get(),
            Math.floor(this.videoEl.currentTime)
        )
    }

    public async loadProgress() {
        const videoId = $store.videoId.get();
        let time = await fetchVideoHistoryTime(videoId);
        if (time) {
            // if video was watched of last 3 seconds then start from the beginning
            if (time + 3 > (this.videoEl.duration || $store.video.get().duration || 0)) time = 0;
            this.videoEl.currentTime = time;
            this.audioEl.currentTime = time;
        }
    }

    public async loadVideo(id: string, autoPlay: boolean = false, saveProgress: boolean = true) {
        if (saveProgress) this.saveProgress();
        const data = await fetchVideoInfo(id);
        $store.video.set(data);
        $store.videoId.set(id);
        this.paused = true;
        this.videoEl.currentTime = 0;
        markVideoAsWatched(id);
        changeView("video");
        historyView.loadHistory(); // refresh history
        updateQueryParam("v", id);
        
        setTimeout(async () => {
            await this.loadProgress();
            if (autoPlay) this.videoEl.play();
        }, 1000);
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