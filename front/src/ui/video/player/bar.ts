import { updateVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { formatTime } from "#utils";
import utils, { uiHelpers } from "@wxn0brp/flanker-ui";
import { clamp } from "@wxn0brp/flanker-ui/utils";
import playerView from ".";
import "./bar.scss";
import { changePlay, toggleFullscreen } from "./status";
import { getNextVideoId, playNext, playPrev } from "./sync";

export function setupBar() {
    let hasHours = false;
    const playPauseBtn = playerView.bar.querySelector<HTMLButtonElement>(".play-pause-btn");
    const timeSpan = playerView.bar.querySelector<HTMLSpanElement>(".time");

    playerView.bufferedRange = playerView.bar.querySelector(".buffered-range")!;
    playerView.playedRange = playerView.bar.querySelector(".played-range")!;
    playerView.progressInput = playerView.bar.querySelector<HTMLInputElement>(".progress");

    const loopInput = playerView.bar.querySelector<HTMLInputElement>("#loop")

    const volume = playerView.bar.querySelector<HTMLInputElement>(".volume");
    const fullscreenBtn = playerView.bar.querySelector<HTMLButtonElement>(".fullscreen-btn");
    const loopQueue = playerView.bar.querySelector<HTMLInputElement>("#loop-queue");
    $store.queueLoop.set(loopQueue.checked);
    const audioFadeEnabled = playerView.bar.querySelector<HTMLInputElement>("#audio-fade");
    uiHelpers.watchCheckbox(audioFadeEnabled, $store.settings.audioFadeEnabled);

    playerView.bar.querySelector("#previous-video")!.addEventListener("click", () => playPrev());
    playerView.bar.querySelector("#next-video")!.addEventListener("click", () => playNext());

    playerView.controls = {
        playPauseBtn,
        progressInput: playerView.progressInput,
        volumeInput: volume,
        fullscreenBtn
    };

    playPauseBtn.addEventListener("click", changePlay);
    playerView.videoEl.addEventListener("click", changePlay);
    uiHelpers.watchCheckbox(loopQueue, $store.queueLoop);

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
            loopInput.checked = !loopInput.checked;
            loopInput.dispatchEvent(new Event("change"));
        }
    });

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

    playerView.progressInput.addEventListener("input", () => {
        const duration = playerView.mediaSync.getDuration();
        if (!isNaN(duration)) {
            const newTime = parseFloat(playerView.progressInput.value);
            playerView.mediaSync.seek(newTime);
        }
    });

    volume.addEventListener("input", () => {
        const vol = parseFloat(volume.value);
        playerView.videoEl.volume = vol;
        playerView.audioEl.volume = vol;
    });

    fullscreenBtn.addEventListener("click", toggleFullscreen);

    loopInput.addEventListener("change", (e) => {
        const loop = (e.target as any).checked;
        playerView.videoEl.loop = loop;
    });

    setTimeout(() => {
        playerView.videoEl.loop = loopInput.checked;
    }, 100);

    // UI sync
    playerView.mediaSync.eventEmitter.on("loadedmetadata", () => {
        playerView.progressInput.max = playerView.mediaSync.getDuration().toString();
        hasHours = playerView.mediaSync.getDuration() >= 3600;
        updateProgressBars();
    });

    const playNextDebounced = utils.debounce(playNext);
    const bufferNextThrottled = utils.throttle(() => {
        let nextVideoId = getNextVideoId();
        if (!nextVideoId) return;

        // if server don't have buffered video then fetch it
        fetchVQL(`api video! s.url = ${nextVideoId}`, { silent: true });
        console.debug("[player] buffering next video on server", nextVideoId);
    }, 25_000);

    const updateVideoHistoryTimeToZero = utils.debounce(() => {
        updateVideoHistoryTime($store.videoId.get(), 0);
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

        // if video was watched of last 3 seconds then start from the beginning
        if (Math.floor(playerView.mediaSync.currentTime) + 3 >= Math.floor(playerView.mediaSync.getDuration())) {
            updateVideoHistoryTimeToZero();
        }

        // if video was watched of last 13 seconds then buffer next (server side)
        if (playerView.mediaSync.currentTime + 13 >= playerView.mediaSync.getDuration() && !playerView.videoEl.loop) {
            bufferNextThrottled();
        }
    });
    playerView.mediaSync.eventEmitter.on("ended", () => !playerView.videoEl.loop && playNextDebounced());

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
    playerView.progressInput.value = currentTime.toString();
    playerView.playedRange.style.width = `${playedPercent}%`;

    // Buffered parts
    const buffered = playerView.videoEl.buffered;
    if (buffered.length > 0) {
        let totalBuffered = 0;
        for (let i = 0; i < buffered.length; i++) {
            totalBuffered = Math.max(totalBuffered, buffered.end(i));
        }
        const bufferedPercent = (totalBuffered / duration) * 100;
        playerView.bufferedRange.style.width = `${bufferedPercent}%`;
    }
}