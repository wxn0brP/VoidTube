import { updateVideoHistoryTime, fetchVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { VideoInfo } from "#types/video";
import historyView from "#ui/history";
import navBarView from "#ui/navBar";
import { updateQueryParam } from "#utils";
import playerView from ".";
import { changeView } from "..";

export function changePlay() {
    playerView.paused = !playerView.paused;
    playerView.paused ? playerView.videoEl.pause() : playerView.videoEl.play();
    playerView.controls.playPauseBtn.textContent = playerView.paused ? "▶️" : "⏸️";
}

export function toggleFullscreen() {
    playerView.element.classList.contains("fullscreen") ? document.exitFullscreen() : playerView.element.requestFullscreen();
    playerView.element.classList.toggle("fullscreen");
    playerView.bar.classList.toggle("fullscreen");
}

export async function saveProgress() {
    playerView.lastUpdateTime = Date.now();
    await updateVideoHistoryTime(
        $store.videoId.get(),
        Math.floor(playerView.videoEl.currentTime)
    )
}

export async function loadProgress() {
    const videoId = $store.videoId.get();
    let time = await fetchVideoHistoryTime(videoId);
    if (time) {
        // if video was watched of last 3 seconds then start from the beginning
        if (time + 3 > (playerView.videoEl.duration || $store.video.get().duration || 0)) time = 0;
        playerView.videoEl.currentTime = time;
        playerView.audioEl.currentTime = time;
    }
}

export async function loadVideo(id: string, autoPlay: boolean = false, saveProgressOpt: boolean = true) {
    if (saveProgressOpt) saveProgress();
    if (!id) return console.error("No video id provided");
    
    const data = await fetchVQL<VideoInfo>(`api video! s.url = ${id}`);

    $store.video.set(data);
    $store.videoId.set(id);
    playerView.paused = true;
    playerView.videoEl.currentTime = 0;

    fetchVQL(`user updateOneOrAdd history s._id=${id} u.watched=true u.last=${Math.floor(Date.now() / 1000)}`).then(() => {
        historyView.loadHistory(); // refresh history
    });
    changeView("video");
    updateQueryParam("v", id);
    navBarView.save("video");
    
    setTimeout(async () => {
        await loadProgress();
        if (autoPlay) playerView.videoEl.play();
    }, 1000);
}