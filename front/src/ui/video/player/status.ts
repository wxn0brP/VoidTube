import { fetchVideoHistoryTime, updateVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { VideoInfo } from "#types/video";
import { changeView } from "#ui/index";
import navBarView from "#ui/navBar";
import historyView from "#ui/view/history";
import playListView from "#ui/view/playList";
import { updateQueryParam } from "#utils";
import utils from "@wxn0brp/flanker-ui";
import playerView from ".";

export function changePlay() {
    playerView.paused = !playerView.paused;
    playerView.paused ? playerView.videoEl.pause() : playerView.videoEl.play();
    playerView.controls.playPauseBtn.textContent = playerView.paused ? "▶️" : "⏸️";
    if (playerView.paused) saveProgress();
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

async function loadVideoFn(id: string, autoPlay: boolean = true, saveProgressOpt: boolean = true) {
    if (saveProgressOpt) saveProgress();
    if (!id) return console.error("No video id provided");
    
    await fetchVQL("api -video-load s.id=0"); // cancel previous load
    await utils.delay(100);
    const data = await fetchVQL<VideoInfo>(`api video! s.url = ${id}`);

    if(!data.formats?.length) return alert("Failed to load video");

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

    $store.nextVideoId.set("");
    playListView.renderRecommendations([]);
    const recommendationsCount = +$store.settings.recommendations.get();
    if (!$store.playlistId.get() && recommendationsCount > 0) {
        const query = `api recommendations s._id = ${id} s.limit = ${recommendationsCount}`;
        fetchVQL<string[]>(query).then(data => {
            if(data.length) $store.nextVideoId.set(data[0]);
            playListView.renderRecommendations(data);
        });
    }
    
    playerView.videoEl.addEventListener("loadedmetadata", async () => {
        await loadProgress();
        if (autoPlay) playerView.videoEl.play();
    }, { once: true });
}

export const loadVideo = utils.debounce<typeof loadVideoFn>(loadVideoFn, 200);

export function loadMediaSession() {
    const video = $store.video.get();
    if (!video) return;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: video.title,
        artist: $store.videoChannelName.get() || "Unknown",
        // album: 'Album',
        artwork: [
            { src: video.thumbnail, sizes: '480x360', type: 'image/png' }
        ]
    });
}