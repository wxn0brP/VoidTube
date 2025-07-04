import { $store } from "#store";
import playerView from ".";
import { playNext, playPrev } from "./sync";
import { emitPlay } from "./tabs";

export function setupAudioSync() {
    playerView.videoEl.addEventListener("play", () => {
        playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        fadeAudioIn();
        playerView.audioEl.play().catch(err => console.error("Audio play error:", err));
        playerView.paused = false;
        emitPlay();
    });

    playerView.videoEl.addEventListener("pause", () => {
        fadeAudioOut().then(() => playerView.audioEl.pause());
        playerView.paused = true;
    });

    playerView.videoEl.addEventListener("seeking", () => {
        playerView.audioEl.currentTime = playerView.videoEl.currentTime;
        if (!playerView.videoEl.paused && playerView.audioEl.paused) {
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
            if (playerView.audioEl.paused)
                playerView.audioEl.play().catch(err => console.error("Audio resume error:", err));
        }
    };
    playerView.videoEl.addEventListener("playing", resumeAudio);
    playerView.videoEl.addEventListener("canplay", resumeAudio);
    playerView.videoEl.addEventListener("canplaythrough", resumeAudio);

    if ("mediaSession" in navigator) {
        navigator.mediaSession.setActionHandler("play", () => {
            playerView.videoEl.play();
            emitPlay();
        });
        navigator.mediaSession.setActionHandler("pause", () => {
            playerView.videoEl.pause();
        });
        navigator.mediaSession.setActionHandler("seekbackward", () => {
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

function getFadeAudio() {
    if (!$store.settings.audioFadeEnabled.get()) return 0;
    const fadeAudio = +$store.settings.audioFade.get() || 0;
    if (isNaN(fadeAudio)) return 0;
    if (fadeAudio > 3_000) return 3_000;
    if (fadeAudio < 0) return 0;
    return fadeAudio;
}

function fadeAudioIn() {
    const targetVolume = playerView.videoEl.volume;
    const fadeAudio = getFadeAudio();
    if (!fadeAudio) return Promise.resolve();

    return new Promise<void>(resolve => {
        if (!targetVolume) { // 0
            resolve();
            return;
        }

        let start = null;

        function step(timestamp: number) {
            if (!start) start = timestamp;
            let progress = timestamp - start;
            let percentage = Math.min(progress / fadeAudio, 1);

            playerView.audioEl.volume = targetVolume * percentage;

            if (percentage < 1)
                requestAnimationFrame(step);
            else
                resolve();

        }

        requestAnimationFrame(step);
    });
}

function fadeAudioOut() {
    const fadeAudio = getFadeAudio();
    if (!fadeAudio) return Promise.resolve();

    return new Promise<void>(resolve => {
        let startVolume = playerView.videoEl.volume;
        if (startVolume <= 0) {
            resolve();
            return;
        }

        let start = null;

        function step(timestamp: number) {
            if (!start) start = timestamp;
            let progress = timestamp - start;
            let percentage = Math.min(progress / fadeAudio, 1);
            playerView.audioEl.volume = startVolume * (1 - percentage);

            if (percentage < 1)
                requestAnimationFrame(step);
            else {
                resolve();
                setTimeout(() => {
                    playerView.audioEl.volume = playerView.videoEl.volume;
                }, fadeAudio + 100);
            }
        }

        requestAnimationFrame(step);
    });
}