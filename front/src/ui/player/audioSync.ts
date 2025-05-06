import { updateVideoHistoryTime } from "#api/history";
import { $store } from "#store";
import { updateQueryParam } from "#utils";
import playerView from ".";
import { loadVideo } from "./status";

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
        if (!playerView.videoEl.paused) {
            playerView.audioEl.play().catch(err => console.error("Audio resume error:", err));
        }
    });

    playerView.videoEl.addEventListener("volumechange", () => {
        playerView.audioEl.volume = playerView.videoEl.volume;
        playerView.controls.volumeInput.value = playerView.videoEl.volume.toString();
    });

    playerView.videoEl.addEventListener("waiting", () => {
        playerView.audioEl.pause();
    });

    playerView.audioEl.addEventListener("seeking", () => {
        if (playerView.videoEl.paused) playerView.audioEl.pause();
    });

    const resumeAudio = () => {
        if (!playerView.videoEl.paused) {
            playerView.audioEl.currentTime = playerView.videoEl.currentTime;
            playerView.audioEl.play().catch(err => console.error("Audio resume error:", err));
        }
    };
    playerView.videoEl.addEventListener("playing", resumeAudio);
    playerView.videoEl.addEventListener("canplay", resumeAudio);
    playerView.videoEl.addEventListener("canplaythrough", resumeAudio);

    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => {
            playerView.videoEl.play();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
            playerView.videoEl.pause();
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
            console.log("seekbackward");
            playerView.videoEl.currentTime = Math.max(0, playerView.videoEl.currentTime - 5);
            playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        });
        navigator.mediaSession.setActionHandler("seekforward", () => {
            playerView.videoEl.currentTime = Math.min(playerView.videoEl.duration, playerView.videoEl.currentTime + 5);
            playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        });
        navigator.mediaSession.setActionHandler("previoustrack", () => {
            playPrev();
        });
        navigator.mediaSession.setActionHandler("nexttrack", () => {
            playNext();
        });
        navigator.mediaSession.setActionHandler("seekto", (e) => {
            playerView.videoEl.currentTime = e.seekTime;
            playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        });          
    }
}

export function playNext() {
    const oldId = $store.videoId.get();
    setTimeout(() => {
        updateVideoHistoryTime(oldId, 0);
    }, 3000);

    const playlist = $store.playlist.get();
    const playlistIndex = $store.playlistIndex.get() || 0;
    let nextIndex = playlistIndex + 1;
    if (nextIndex >= playlist.length) {
        if (playerView.loopPlaylist) {
            nextIndex = 0;
        } else return;
    }

    const nextVideoId = playlist[nextIndex];
    if (!nextVideoId) return;
    loadVideo(nextVideoId, true);
    $store.playlistIndex.set(nextIndex);
    updateQueryParam("pi", (nextIndex).toString());
}

export function playPrev() {
    const oldId = $store.videoId.get();
    setTimeout(() => {
        updateVideoHistoryTime(oldId, 0);
    }, 3000);

    const playlist = $store.playlist.get();
    const playlistIndex = $store.playlistIndex.get() || 0;
    let nextIndex = playlistIndex - 1;
    if (nextIndex < 0) nextIndex = 0;

    const nextVideoId = playlist[nextIndex];
    if (!nextVideoId) return;

    loadVideo(nextVideoId, true);
    $store.playlistIndex.set(nextIndex);
    updateQueryParam("pi", (nextIndex).toString());
}