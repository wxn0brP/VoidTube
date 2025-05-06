import { updateVideoHistoryTime } from "#api/history";
import { $store } from "#store";
import { clamp, debounce, formatTime } from "#utils";
import playerView from ".";
import { playNext } from "./audioSync";
import { changePlay, toggleFullscreen } from "./status";

export function setupBar() {
    let hasHours = false;
    const playPauseBtn = playerView.bar.querySelector(".play-pause-btn") as HTMLButtonElement;
    const timeSpan = playerView.bar.querySelector(".time") as HTMLSpanElement;

    playerView.bufferedRange = playerView.bar.querySelector(".buffered-range")!;
    playerView.playedRange = playerView.bar.querySelector(".played-range")!;
    playerView.progressInput = playerView.bar.querySelector(".progress") as HTMLInputElement;

    const volume = playerView.bar.querySelector(".volume") as HTMLInputElement;
    const fullscreenBtn = playerView.bar.querySelector(".fullscreen-btn") as HTMLButtonElement;
    const loopPlaylist = playerView.bar.querySelector("#loopPlaylist") as HTMLInputElement;
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

    playerView.bar.querySelector<HTMLInputElement>("#loop")!.addEventListener("change", (e) => {
        const loop = (e.target as any).checked;
        playerView.videoEl.loop = loop;
    });

    setTimeout(() => {
        const loop = playerView.bar.querySelector<HTMLInputElement>("#loop")!.checked;
        playerView.videoEl.loop = loop;
    }, 100);

    // UI sync
    playerView.videoEl.addEventListener("loadedmetadata", () => {
        playerView.progressInput.max = playerView.videoEl.duration.toString();
        hasHours = playerView.videoEl.duration >= 3600;
        updateProgressBars();
    });

    const playNextDebounced = debounce(playNext);

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
            updateVideoHistoryTime($store.videoId.get(), 0);
        }

        if (playerView.videoEl.currentTime + 0.1 >= playerView.videoEl.duration && !playerView.videoEl.loop) {
            playNextDebounced();
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