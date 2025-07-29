import { $store } from "#store";
import navBarView from "#ui/navBar";
import playerView from "#ui/video/player";
import { loadVideo } from "#ui/video/player/status";
import queuePanel from "#ui/video/queue";
import channelView from "#ui/view/channel";
import { changeView } from "./ui";
import searchBarView from "./ui/searchBar";
import { getYouTubeVideoId, setTitle, updateQueryParam } from "./utils";

await new Promise(r => setTimeout(r, 100)); // wait for ui to mount

export function initParma(autoPlay = false) {
    const urlParams = new URLSearchParams(window.location.search);

    const query = urlParams.get("query");
    if (query) {
        setTimeout(() => {
            searchBarView.searchInput.value = decodeURIComponent(query).replaceAll("+", " ");
            searchBarView.search();
        }, 1000);
        return;
    }

    const channel = urlParams.get("channel");
    if (channel) {
        setTimeout(() => {
            channelView.load(channel);
        }, 1000);
        return;
    }

    const playlistId = urlParams.get("p");
    if (playlistId) {
        const index = urlParams.get("pi") || "0";
        setTimeout(() => queuePanel.loadPlaylist(playlistId), 1000);
        setTimeout(() => {
            $store.queueIndex.set(+index);
            loadVideo(queuePanel.queue[$store.queueIndex.get()]);
        }, 1000);
        return;
    }

    const videoId = urlParams.get("v");
    if (videoId) {
        const id = getYouTubeVideoId(videoId);
        setTimeout(() => loadVideo(id, { autoPlay }), 1000);
        updateQueryParam("v", id);
        changeView("video");
        navBarView.save("video");
    } else {
        changeView("history");
        setTitle("");
        navBarView.save("history");
    }

    const time = urlParams.get("t");
    if (time) {
        setTimeout(() => {
            playerView.mediaSync.seek(+time);
        }, 1000);
    }
}

initParma();
await import("./store/registers");

window.addEventListener("popstate", () => {
    initParma(true);
});