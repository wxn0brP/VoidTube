import { updateVideoHistoryTime } from "#api/history";
import { $store } from "#store";
import { uiMsg } from "#ui/modal/message";
import navBarView from "#ui/navBar";
import playerView from ".";
import queuePanel from "../queue";
import { fetchSponsorSegments, sponsorBlock } from "./sponsorBlock";
import { loadVideo } from "./status";

export function playNext() {
    const oldId = $store.videoId.get();
    setTimeout(() => {
        updateVideoHistoryTime(oldId, 0);
    }, 3000);

    const nextVideo = getNextVideoId();
    if (!nextVideo) {
        uiMsg("End of queue");
        return;
    }
    const { id, store } = nextVideo;

    if (store !== undefined)
        $store.queueIndex.set(store);
    
    if (nextVideo.append) {
        $store.recommendedId.set("");
        queuePanel.append(id);
    }

    loadVideo(id);
}

export function getNextVideoId() {
    const length = queuePanel.queue.length;
    const nextVideoIndex = $store.queueIndex.get() + 1;

    if (nextVideoIndex >= length) {
        // If end of queue and looping is enabled, reset to the first video
        if ($store.queueLoop.get()) {
            return {
                id: queuePanel.queue[0],
                store: 0
            };
        }
        // If a recommended video is available, append it to the queue if not present
        else if ($store.recommendedId.get()) {
            const id = $store.recommendedId.get();
            return {
                id,
                store: Math.max(queuePanel.queue.length, 1),
                append: true
            };
        }
        // No next video available
        else return null;
    }

    return {
        id: queuePanel.queue[nextVideoIndex],
        store: nextVideoIndex
    };
}

function getPrevVideoIdFromStack(i = navBarView.stack.length - 2) {
    if (i < 0) return;
    const item = navBarView.stack[i];
    if (item.view === "video")
        return new URL(location.origin + item.search).searchParams.get("v");

    return getPrevVideoIdFromStack(i - 1);
}

export function playPrev() {
    const oldId = $store.videoId.get();
    setTimeout(() => {
        updateVideoHistoryTime(oldId, 0);
    }, 3000);

    let prevVideoId = "";

    const length = queuePanel.queue.length;
    if (length) {
        let prev = $store.queueIndex.get() - 1;
        if (prev < 0)
            prev = $store.queueLoop.get() ? length - 1 : 0;
        $store.queueIndex.set(prev);
        prevVideoId = queuePanel.queue[prev];
    }

    if (!prevVideoId) prevVideoId = getPrevVideoIdFromStack();
    if (!prevVideoId) return;

    loadVideo(prevVideoId);
}

export function setUpSponsorBlock() {
    playerView.mediaSync.eventEmitter.on("timeupdate", sponsorBlock);
    playerView.mediaSync.eventEmitter.on("seeking", sponsorBlock);
    playerView.mediaSync.eventEmitter.on("loadedmetadata", async () => {
        if (!$store.settings.sponsorBlock.get()) return;
        const id = $store.videoId.get();
        const segmentsId = $store.sponsorBlock.id.get();
        if (id === segmentsId) return;
        const segments = await fetchSponsorSegments(id);
        $store.sponsorBlock.segments.set(segments);
        $store.sponsorBlock.id.set(id);
    });
}