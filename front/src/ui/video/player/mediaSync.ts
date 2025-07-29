import { clamp } from "@wxn0brp/flanker-ui/utils";
import { fadeAudioIn, fadeAudioOut } from "./audioSync";
import { playNext, playPrev } from "./sync";

interface MediaSyncControllerConfig {
    audio?: HTMLAudioElement;
    video?: HTMLVideoElement;
}

type MediaClient = HTMLAudioElement | HTMLVideoElement;

class MediaSyncController {
    private audio?: HTMLAudioElement;
    private video?: HTMLVideoElement;
    private duration = 0;
    private clockTime = 0;
    private playing = false;
    public audioEnabled = true;
    public videoEnabled = true;

    constructor(config: MediaSyncControllerConfig) {
        this.audio = config.audio;
        this.video = config.video;

        if ("mediaSession" in navigator) {
            this.setupMediaSessionHandlers();
        }

        if (this.audio) this.monitorMedia(this.audio);
        if (this.video) this.monitorMedia(this.video);

        setInterval(() => {
            this.tick();
        }, 333);
    }

    private monitorMedia(el: MediaClient) {
        el.addEventListener("loadedmetadata", () => {
            this.onMediaLoadedMetadata();
        });
    }

    private onMediaLoadedMetadata() {
        if (this.audioEnabled && this.audio?.duration) this.setDuration(this.audio.duration);
        else if (this.videoEnabled && this.video?.duration) this.setDuration(this.video.duration); 
        this.syncClients();

        if (this.playing) {
            if (this.audioEnabled) this.audio?.play().catch(() => { });
            if (this.videoEnabled) this.video?.play().catch(() => { });
        }
    }

    play() {
        if (this.playing) return;
        this.playing = true;
        if (this.audioEnabled) this.audio?.play().catch(() => { });
        if (this.videoEnabled) this.video?.play().catch(() => { });
        fadeAudioIn();
    }

    pause() {
        if (!this.playing) return;
        this.playing = false;
        this.video?.pause();
        fadeAudioOut().then(() => this.audio?.pause());
    }

    seek(time: number) {
        this.clockTime = clamp(0, time, this.duration);
        this.syncClients();
    }

    setDuration(sec: number) {
        this.duration = sec;
    }

    private syncClients() {
        if (this.audioEnabled && this.isUnSync(this.audio)) this.audio.currentTime = this.clockTime;
        if (this.videoEnabled && this.isUnSync(this.video)) this.video.currentTime = this.clockTime;
    }

    isUnSync(source: MediaClient) {
        return Math.abs(source.currentTime - this.clockTime) > 0.3;
    }

    private tick() {
        if (!this.playing) return;
        this.clockTime = this.audio?.currentTime ?? this.video?.currentTime ?? 0;
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