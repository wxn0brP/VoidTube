import { clamp } from "@wxn0brp/flanker-ui/utils";
import { fadeAudioIn, fadeAudioOut } from "./audioSync";
import { playNext, playPrev } from "./sync";
import { UniversalEventEmitter } from "#utils/eventEmitter";

interface MediaSyncControllerConfig {
    audio: HTMLAudioElement;
    video: HTMLVideoElement;
}

type MediaClient = HTMLAudioElement | HTMLVideoElement;

class MediaSyncController {
    private audio?: HTMLAudioElement;
    private video?: HTMLVideoElement;
    private duration = 0;
    private clockTime = 0;
    private playing = false;
    public videoEnabled = true;
    public eventEmitter = new UniversalEventEmitter();

    constructor(config: MediaSyncControllerConfig) {
        this.audio = config.audio;
        this.video = config.video;

        if ("mediaSession" in navigator) {
            this.setupMediaSessionHandlers();
        }

        this.events();

        setInterval(() => {
            this.tick();
        }, 333);
    }

    private events() {
        const audio = this.audio;
        audio.addEventListener("loadedmetadata", () => this.onMediaLoadedMetadata());
        audio.addEventListener("loadedmetadata", (...args) => this.eventEmitter.emit("loadedmetadata", ...args));
        audio.addEventListener("loadeddata", (...args) => this.eventEmitter.emit("loadeddata", ...args));
        audio.addEventListener("timeupdate", (...args) => this.eventEmitter.emit("timeupdate", ...args));
        audio.addEventListener("seeking", (...args) => this.eventEmitter.emit("seeking", ...args));
        audio.addEventListener("ended", (...args) => this.eventEmitter.emit("ended", ...args));
        audio.addEventListener("pause", (...args) => this.eventEmitter.emit("pause", ...args));
        audio.addEventListener("play", (...args) => this.eventEmitter.emit("play", ...args));
        audio.addEventListener("error", (...args) => this.eventEmitter.emit("error", ...args));
        audio.addEventListener("progress", (...args) => this.eventEmitter.emit("progress", ...args));
    }

    private onMediaLoadedMetadata() {
        if (this.audio.duration) this.setDuration(this.audio.duration);
        this.syncClients();

        if (this.playing) {
            this.audio.play().catch(() => { });
            if (this.videoEnabled) this.video?.play().catch(() => { });
        }
    }

    play() {
        if (this.playing) return;
        this.playing = true;
        this.audio.play().catch(() => { });
        if (this.videoEnabled) this.video.play().catch(() => { });
        fadeAudioIn();
    }

    pause() {
        if (!this.playing) return;
        this.playing = false;
        this.video?.pause();
        fadeAudioOut().then(() => this.audio.pause());
    }

    seek(time: number) {
        this.clockTime = clamp(0, time, this.duration);
        this.audio.currentTime = this.clockTime;
        if (this.videoEnabled) this.video.currentTime = this.clockTime;
    }

    setDuration(sec: number) {
        this.duration = sec;
    }

    private syncClients() {
        if (this.isUnSync(this.audio)) this.audio.currentTime = this.clockTime;
        if (this.videoEnabled && this.isUnSync(this.video)) this.video.currentTime = this.clockTime;
    }

    isUnSync(source: MediaClient) {
        return Math.abs(source.currentTime - this.clockTime) > 0.2;
    }

    private tick() {
        if (!this.playing) return;
        this.clockTime = this.audio.currentTime ?? this.video.currentTime ?? 0;
    }

    private setupMediaSessionHandlers() {
        navigator.mediaSession.setActionHandler("play", () => this.play());
        navigator.mediaSession.setActionHandler("pause", () => this.pause());
        navigator.mediaSession.setActionHandler("seekto", details => {
            if (details && typeof details.seekTime === "number") {
                this.seek(details.seekTime);
            }
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
            const newTime = Math.max(0, this.clockTime - 5);
            this.seek(newTime);
        });
        navigator.mediaSession.setActionHandler("seekforward", () => {
            const newTime = Math.min(this.duration, this.clockTime + 5);
            this.seek(newTime);
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => playPrev());
        navigator.mediaSession.setActionHandler("nexttrack", () => playNext());
    }

    get currentTime() {
        return this.clockTime;
    }

    get isPlaying() {
        return this.playing;
    }

    getDuration() {
        return this.duration;
    }
}

export default MediaSyncController;