import playerView from ".";

export function setupAudioSync() {
    playerView.videoEl.addEventListener("play", () => {
        playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        playerView.audioEl.play().catch(err => console.error("Audio play error:", err));
        playerView.paused = false;
    });

    playerView.videoEl.addEventListener("pause", () => {
        playerView.audioEl.pause();
        playerView.paused = true;
    });

    playerView.videoEl.addEventListener("seeking", () => {
        playerView.audioEl.currentTime = playerView.videoEl.currentTime;
    });

    playerView.videoEl.addEventListener("volumechange", () => {
        playerView.audioEl.volume = playerView.videoEl.volume;
        playerView.controls.volumeInput.value = playerView.videoEl.volume.toString();
    });
}