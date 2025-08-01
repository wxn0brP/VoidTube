import { updateVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { formatTime } from "#utils";
import { watchCheckbox } from "@wxn0brp/flanker-ui/component/helpers";
import { toggleBoolean } from "@wxn0brp/flanker-ui/storeUtils";
import { clamp, debounce, round, throttle } from "@wxn0brp/flanker-ui/utils";
import playerView from ".";
import "./bar.scss";
import { changePlay, toggleFullscreen } from "./status";
import { getNextVideoId, playNext, playPrev } from "./sync";

let bufferedRange: HTMLDivElement;
let playedRange: HTMLDivElement;
let progressInput: HTMLInputElement;
export let playPauseBtn: HTMLButtonElement;
const playNextDebounced = debounce(playNext);

const bufferNextThrottled = throttle(() => {
    let nextVideo = getNextVideoId();
    if (!nextVideo) return;
    const { id } = nextVideo;

    // if server don't have buffered video then fetch it
    fetchVQL(`api video! s.url = ${id}`, { silent: true });
    console.debug("[player] buffering next video on server", id);
}, 25_000);

export function setupBar() {
    let hasHours = false;
    playPauseBtn = playerView.bar.qi<HTMLButtonElement>("play-pause");
    const timeSpan = playerView.bar.qi<HTMLSpanElement>("time");
    const volume = playerView.bar.qi<HTMLInputElement>("volume");
    const fullscreenBtn = playerView.bar.qi<HTMLButtonElement>("toggle-fullscreen");
    const loopQueue = playerView.bar.qi<HTMLInputElement>("loop-queue");
    const audioFadeEnabled = playerView.bar.qi<HTMLInputElement>("audio-fade");
    const loopInput = playerView.bar.qi<HTMLInputElement>("loop")
    bufferedRange = playerView.bar.qi("buffered-range");
    playedRange = playerView.bar.qi("played-range");
    progressInput = playerView.bar.qi("progress");

    watchCheckbox(audioFadeEnabled, $store.settings.audioFadeEnabled);
    watchCheckbox(loopInput, $store.player.loop);
    $store.player.loop.subscribe((val) => {
        playerView.videoEl.loop = val;
        playerView.audioEl.loop = val;
    });
    $store.queueLoop.set(loopQueue.checked);
    $store.player.loop.set(loopInput.checked);

    playerView.bar.qi("previous-video").addEventListener("click", () => playPrev());
    playerView.bar.qi("next-video").addEventListener("click", () => playNext());

    playPauseBtn.addEventListener("click", changePlay);
    playerView.videoEl.addEventListener("click", changePlay);
    watchCheckbox(loopQueue, $store.queueLoop);

    let full_timeout: NodeJS.Timeout;
    document.addEventListener("mousemove", () => {
        if (!playerView.element.classList.contains("fullscreen")) return;
        clearTimeout(full_timeout);

        playerView.bar.style.opacity = "1";
        playerView.videoEl.style.cursor = "";
        full_timeout = setTimeout(() => {
            playerView.bar.style.opacity = "";
            if (playerView.element.classList.contains("fullscreen"))
                setTimeout(() => { playerView.videoEl.style.cursor = "none"; }, 1000);
        }, 2000);
    });

    progressInput.addEventListener("input", () => {
        const duration = playerView.mediaSync.getDuration();
        if (!isNaN(duration)) {
            const newTime = parseFloat(progressInput.value);
            playerView.mediaSync.seek(newTime);
        }
    });

    volume.addEventListener("input", () => {
        const vol = parseFloat(volume.value);
        playerView.videoEl.volume = vol;
        playerView.audioEl.volume = vol;
        $store.player.volume.set(vol);
    });

    fullscreenBtn.addEventListener("click", toggleFullscreen);

    // UI sync
    playerView.mediaSync.eventEmitter.on("loadedmetadata", () => {
        progressInput.max = playerView.mediaSync.getDuration().toString();
        hasHours = playerView.mediaSync.getDuration() >= 3600;
        updateProgressBars();
    });

    // TODO refactor to new media sync
    playerView.mediaSync.eventEmitter.on("progress", () => updateProgressBars());
    playerView.mediaSync.eventEmitter.on("timeupdate", () => {
        updateProgressBars();
        timeSpan.textContent =
            formatTime(playerView.mediaSync.currentTime, hasHours) + " / " +
            formatTime(playerView.mediaSync.getDuration(), hasHours);

        if (playerView.lastUpdateTime + 10_000 < Date.now()) {
            playerView.lastUpdateTime = Date.now();
            updateVideoHistoryTime($store.videoId.get(), Math.floor(playerView.mediaSync.currentTime));
        }

        // if video was watched of last 0.1 seconds then play next
        if (!$store.player.loop.get() && round(playerView.mediaSync.currentTime, 1) + 0.1 >= round(playerView.mediaSync.getDuration(), 1)) {
            playNextDebounced();
        }

        // if video was watched of last 13 seconds then buffer next (server side)
        if (playerView.mediaSync.currentTime + 13 >= playerView.mediaSync.getDuration() && !$store.player.loop.get()) {
            bufferNextThrottled();
        }
    });
    playerView.mediaSync.eventEmitter.on("ended", () => !$store.player.loop.get() && playNextDebounced());
    playerView.mediaSync.eventEmitter.on("ended", () => updateVideoHistoryTime($store.videoId.get(), 0));

    playerView.mediaSync.eventEmitter.on("play", () => {
        playPauseBtn.textContent = "⏸️";
        playerView.mediaSync.play();
    });

    playerView.mediaSync.eventEmitter.on("pause", () => {
        playPauseBtn.textContent = "▶️";
        playerView.mediaSync.pause();
    });
}

export function updateProgressBars() {
    const duration = playerView.mediaSync.getDuration();
    const currentTime = playerView.mediaSync.currentTime;

    if (isNaN(duration) || duration === Infinity) return;

    // Played part
    const playedPercent = (currentTime / duration) * 100;
    progressInput.value = currentTime.toString();
    playedRange.style.width = `${playedPercent}%`;

    // Buffered parts
    const buffered = playerView.videoEl.buffered;
    if (buffered.length > 0) {
        let totalBuffered = 0;
        for (let i = 0; i < buffered.length; i++) {
            totalBuffered = Math.max(totalBuffered, buffered.end(i));
        }
        const bufferedPercent = (totalBuffered / duration) * 100;
        bufferedRange.style.width = `${bufferedPercent}%`;
    }
}

document.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
        document.exitFullscreen();
        playerView.element.classList.remove("fullscreen");
        playerView.bar.classList.remove("fullscreen");
    }

    if (e.target instanceof HTMLInputElement) return;
    if (e.target instanceof HTMLTextAreaElement) return;

    if (e.code === "Space" || e.key === "k") {
        e.preventDefault();
        changePlay();
    }

    if (e.key === "f") {
        toggleFullscreen();
    }

    if (e.code === "ArrowRight") {
        const time = Math.min(playerView.mediaSync.getDuration(), playerView.mediaSync.currentTime + 5);
        playerView.mediaSync.seek(time);
    }

    if (e.code === "ArrowLeft") {
        const time = Math.max(0, playerView.mediaSync.currentTime - 5);
        playerView.mediaSync.seek(time);
    }

    if (e.code === "ArrowUp") {
        const vol = Math.min(1, playerView.videoEl.volume + 0.05);
        playerView.videoEl.volume = vol;
        e.preventDefault();
    }

    if (e.code === "ArrowDown") {
        const vol = Math.max(0, playerView.videoEl.volume - 0.05);
        playerView.videoEl.volume = vol;
        e.preventDefault();
    }

    if (!isNaN(parseInt(e.key))) {
        const value = parseInt(e.key) * 10;
        const time = clamp(0, playerView.mediaSync.getDuration() * (value / 100), playerView.mediaSync.getDuration());
        playerView.mediaSync.seek(time);
    }

    if (e.key === "l") {
        toggleBoolean($store.player.loop);
    }
});