import { fetchVideoHistoryTime, updateVideoHistoryTime } from "#api/history";
import { fetchVQL } from "#api/index";
import { $store, appendLastVideos } from "#store";
import { LoadVideoOpts, VideoInfo } from "#types/video";
import { changeView } from "#ui/index";
import { uiMsg } from "#ui/modal/message";
import navBarView from "#ui/navBar";
import historyView from "#ui/view/history";
import { updateQueryParam } from "#utils";
import utils from "@wxn0brp/flanker-ui";
import playerView from ".";
import recommendationPanel from "../recommendations";
import { emitLastVideo, emitPlay } from "./tabs";
import queuePanel from "../queue";

export function changePlay() {
    const action = playerView.mediaSync.isPlaying;
    playerView.mediaSync[action ? "pause" : "play"]();
    playerView.controls.playPauseBtn.textContent = action ? "▶️" : "⏸️";
    if (!action) saveProgress();
    else emitPlay();
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
        Math.floor(playerView.mediaSync.currentTime)
    )
}

export async function loadProgress() {
    const videoId = $store.videoId.get();
    let time = await fetchVideoHistoryTime(videoId);
    if (time) {
        // if video was watched of last 3 seconds then start from the beginning
        if (time + 3 > (playerView.mediaSync.getDuration() || $store.video.get().duration || 0)) time = 0;
        playerView.mediaSync.seek(time);
    }
}

async function loadVideoFn(id: string, opts: Partial<LoadVideoOpts> = {}) {
    opts = {
        autoPlay: true,
        saveProgressOpt: true,
        saveNav: true,
        ...opts,
    }

    if (opts.saveProgressOpt) saveProgress();
    if (!id) return console.error("No video id provided");

    await fetchVQL("api -video-load s.id=0"); // cancel previous load
    await utils.delay(100);
    const data = await fetchVQL<VideoInfo>(`api video! s.url = ${id}`);

    if (!data.formats?.length) return uiMsg("Failed to load video");

    $store.video.set(data);
    $store.videoId.set(id);
    playerView.mediaSync.pause();
    playerView.mediaSync.seek(0);

    fetchVQL(`user updateOneOrAdd history s._id=${id} u.watched=true u.last=${Math.floor(Date.now() / 1000)}`).then(() => {
        // historyView.loadHistory(); // refresh history
        historyView.appendLastVideo(id);
    });
    changeView("video");
    updateQueryParam("v", id);
    navBarView.save("video");

    recommendationPanel.render([]);
    const recommendationsCount = +$store.settings.recommendations.get();
    // TODO -
    if (recommendationsCount > 0) {
        const query = `api recommendations s._id = ${id} s.limit = ${recommendationsCount}`;
        fetchVQL<string[]>(query).then(data => {
            $store.recommendedId.set(data[0]);
            recommendationPanel.render(data);
        });
    }

    playerView.mediaSync.eventEmitter.once("loadedmetadata", async () => {
        await loadProgress();
        if (opts.autoPlay) playerView.mediaSync.play();
    });

    if ($store.settings.antiRecommendationLoop.get()) {
        appendLastVideos(id);
        emitLastVideo();
    }

    if (!queuePanel.queue.includes(id)) queuePanel.append(id);
}

export const loadVideo = utils.debounce<typeof loadVideoFn>(loadVideoFn, 200);

export function loadMediaSession() {
    if (!$store.videoId.get()) return;
    const baseUrl = `https://i.ytimg.com/vi/${$store.videoId.get()}/`;
    navigator.mediaSession.metadata = new MediaMetadata({
        title: $store.video.get()?.title || "Unknown",
        artist: $store.videoChannelName.get() || "Unknown",
        // album: "Album",
        artwork: [
            { src: baseUrl + "default.jpg", sizes: "120x90", type: "image/jpeg" },
            { src: baseUrl + "hqdefault.jpg", sizes: "480x360", type: "image/jpeg" },
            { src: baseUrl + "mqdefault.jpg", sizes: "320x180", type: "image/jpeg" },
            { src: baseUrl + "sddefault.jpg", sizes: "640x480", type: "image/jpeg" },
            { src: baseUrl + "maxresdefault.jpg", sizes: "1280x720", type: "image/jpeg" }
        ]
    });
}