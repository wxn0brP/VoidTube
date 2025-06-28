import { updateVideoHistoryTime } from "#api/history";
import { $store } from "#store";
import navBarView from "#ui/navBar";
import { updateQueryParam } from "#utils";
import playerView from ".";
import queuePanel from "../queue";
import { fetchSponsorSegments, sponsorBlock } from "./sponsorBlock";
import { loadVideo } from "./status";

export function playNext() {
    const oldId = $store.videoId.get();
    setTimeout(() => {
        updateVideoHistoryTime(oldId, 0);
    }, 3000);

    let nextVideoId = $store.nextVideoId.get();

    const playlist = $store.playlist.get();
    const playlistIndex = $store.playlistIndex.get() || 0;
    let nextIndex = playlistIndex + 1;
    if (nextIndex >= playlist.length) {
        // if -1 then no loop
        nextIndex = playerView.loopPlaylist ? 0 : -1;
    }
    const nextVideoIdTemp = playlist[nextIndex];
    if (nextVideoIdTemp) {
        nextVideoId = nextVideoIdTemp;
        $store.playlistIndex.set(nextIndex);
        updateQueryParam("pi", (nextIndex).toString());
        scrollToPlaylistElement();
    }

    loadVideo(nextVideoId);
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

    if ($store.playlistId.get()) {
        const playlist = $store.playlist.get();
        const playlistIndex = $store.playlistIndex.get() || 0;
        let nextIndex = playlistIndex - 1;
        if (nextIndex < 0) nextIndex = 0;
        const nextVideoId = playlist[nextIndex];
        if (nextVideoId) {
            prevVideoId = nextVideoId;
            $store.playlistIndex.set(nextIndex);
            updateQueryParam("pi", (nextIndex).toString());
            scrollToPlaylistElement();
        }
    }
        
    if (!prevVideoId) prevVideoId = getPrevVideoIdFromStack();
    if (!prevVideoId) return

    loadVideo(prevVideoId);
}

export function scrollToPlaylistElement() {
    const elements = queuePanel.element.querySelectorAll(".videoCard");
    elements[$store.playlistIndex.get() || 0].scrollIntoView({ behavior: "smooth", block: "center" });
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