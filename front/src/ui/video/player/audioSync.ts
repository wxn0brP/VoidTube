import { $store } from "#store";
import playerView from ".";

function getFadeAudio() {
    if (!$store.settings.audioFadeEnabled.get()) return 0;
    const fadeAudio = +$store.settings.audioFade.get() || 0;
    if (isNaN(fadeAudio)) return 0;
    if (fadeAudio > 3_000) return 3_000;
    if (fadeAudio < 0) return 0;
    return fadeAudio;
}

export function fadeAudioIn() {
    const targetVolume = $store.player.volume.get();
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

export function fadeAudioOut() {
    const fadeAudio = getFadeAudio();
    if (!fadeAudio) return Promise.resolve();

    return new Promise<void>(resolve => {
        let startVolume = $store.player.volume.get();
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