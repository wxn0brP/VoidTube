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

    const nextVideoId = getNextVideoId();
    if (!nextVideoId) {
        uiMsg("End of queue");
        return;
    }
    queuePanel.queueIndex++;

    loadVideo(nextVideoId);
}

export function getNextVideoId() {
    const length = queuePanel.queue.length;
    const index = queuePanel.queueIndex + 1;
    if (index >= length) {
        if (playerView.loopPlaylist) return queuePanel.queue[0];
        else if($store.recommendedId.get()) return $store.recommendedId.get();
        else return null;
    }

    return queuePanel.queue[index];
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
        let prev = --queuePanel.queueIndex;
        if (prev < 0) {
            if (playerView.loopPlaylist) prev = length - 1;
            else {
                prev = 0;
                queuePanel.queueIndex = 0;
            }
        }
        prevVideoId = queuePanel.queue[prev];
    }
        
    if (!prevVideoId) prevVideoId = getPrevVideoIdFromStack();
    if (!prevVideoId) return;

    loadVideo(prevVideoId);
}

export function setUpSponsorBlock() {
    playerView.videoEl.addEventListener("timeupdate", sponsorBlock);
    playerView.videoEl.addEventListener("seeking", sponsorBlock);
    playerView.videoEl.addEventListener("loadedmetadata", async () => {
        if (!$store.settings.sponsorBlock.get()) return;
        const id = $store.videoId.get();
        const segmentsId = $store.sponsorBlock.id.get();
        if (id === segmentsId) return;
        const segments = await fetchSponsorSegments(id);
        $store.sponsorBlock.segments.set(segments);
        $store.sponsorBlock.id.set(id);
    });
}