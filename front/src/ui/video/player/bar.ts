import { updateVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { clamp, formatTime } from "#utils";
import utils from "@wxn0brp/flanker-ui";
import playerView from ".";
import { playNext } from "./audioSync";
import { changePlay, toggleFullscreen } from "./status";

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
    const loopPlaylist = playerView.bar.querySelector<HTMLInputElement>("#loopPlaylist");
    playerView.loopPlaylist = loopPlaylist.checked;

    playerView.controls = {
        playPauseBtn,
        progressInput: playerView.progressInput,
        volumeInput: volume,
        fullscreenBtn
    };

    playPauseBtn.addEventListener("click", changePlay);
    playerView.videoEl.addEventListener("click", changePlay);
    loopPlaylist.addEventListener("change", () => {
        playerView.loopPlaylist = loopPlaylist.checked;
    })

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
            const time = Math.min(playerView.videoEl.duration, playerView.videoEl.currentTime + 5);
            playerView.videoEl.currentTime = playerView.audioEl.currentTime = time;
        }

        if (e.code === "ArrowLeft") {
            const time = Math.max(0, playerView.videoEl.currentTime - 5);
            playerView.videoEl.currentTime = playerView.audioEl.currentTime = time;
        }

        if (e.code === "ArrowUp") {
            const vol = Math.min(1, playerView.videoEl.volume + 0.05);
            playerView.videoEl.volume = playerView.audioEl.volume = vol;
            e.preventDefault();
        }

        if (e.code === "ArrowDown") {
            const vol = Math.max(0, playerView.videoEl.volume - 0.05);
            playerView.videoEl.volume = playerView.audioEl.volume = vol;
            e.preventDefault();
        }

        if (!isNaN(parseInt(e.key))) {
            const value = parseInt(e.key) * 10;
            const time = clamp(0, playerView.videoEl.duration * (value / 100), playerView.videoEl.duration);
            playerView.videoEl.currentTime = playerView.audioEl.currentTime = time;
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
        const duration = playerView.videoEl.duration;
        if (!isNaN(duration)) {
            const newTime = parseFloat(playerView.progressInput.value);
            playerView.videoEl.currentTime = newTime;
            playerView.audioEl.currentTime = newTime;
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
    playerView.videoEl.addEventListener("loadedmetadata", () => {
        playerView.progressInput.max = playerView.videoEl.duration.toString();
        hasHours = playerView.videoEl.duration >= 3600;
        updateProgressBars();
    });

    const playNextDebounced = utils.debounce(playNext);
    const bufferNextThrottled = utils.throttle(() => {
        let nextVideoId = $store.nextVideoId.get();

        if ($store.playlistId.get()) {
            const playlistIndex = $store.playlistIndex.get();
            if (playlistIndex !== undefined) {
                const nextVideoIdTemp = $store.playlist.get()[playlistIndex + 1];
                if (nextVideoIdTemp) nextVideoId = nextVideoIdTemp;
            }
        }

        if (!nextVideoId) return;

        // if server don't have buffered video then fetch it
        fetchVQL(`api video! s.url = ${nextVideoId}`, { silent: true });
        console.debug("[player] buffering next video on server", nextVideoId);
    }, 25_000);

    const updateVideoHistoryTimeToZero = utils.debounce(() => {
        updateVideoHistoryTime($store.videoId.get(), 0);
    });

    playerView.videoEl.addEventListener("progress", () => updateProgressBars());
    playerView.videoEl.addEventListener("timeupdate", () => {
        updateProgressBars();
        timeSpan.textContent =
            formatTime(playerView.videoEl.currentTime, hasHours) + " / " +
            formatTime(playerView.videoEl.duration, hasHours);

        if (playerView.lastUpdateTime + 10_000 < Date.now()) {
            playerView.lastUpdateTime = Date.now();
            updateVideoHistoryTime($store.videoId.get(), Math.floor(playerView.videoEl.currentTime));
        }

        // if video was watched of last 3 seconds then start from the beginning
        if (Math.floor(playerView.videoEl.currentTime) + 3 >= Math.floor(playerView.videoEl.duration)) {
            updateVideoHistoryTimeToZero();
        }

        // play next video
        if (playerView.videoEl.currentTime + 0.1 >= playerView.videoEl.duration && !playerView.videoEl.loop) {
            playNextDebounced();
        }

        // if video was watched of last 13 seconds then buffer next (server side)
        if (playerView.videoEl.currentTime + 13 >= playerView.videoEl.duration && !playerView.videoEl.loop) {
            bufferNextThrottled();
        }
    });

    playerView.videoEl.addEventListener("play", () => {
        playPauseBtn.textContent = "⏸️";
        playerView.paused = false;
    });

    playerView.videoEl.addEventListener("pause", () => {
        playPauseBtn.textContent = "▶️";
        playerView.paused = true;
    });
}

export function updateProgressBars() {
    const duration = playerView.videoEl.duration;
    const currentTime = playerView.videoEl.currentTime;

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