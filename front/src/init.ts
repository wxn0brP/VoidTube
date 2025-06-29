import channelView from "#ui/view/channel";
import navBarView from "#ui/navBar";
import { changeView } from "./ui";
import searchBarView from "./ui/searchBar";
import { getYouTubeVideoId, setTitle, updateQueryParam } from "./utils";
import { loadVideo } from "#ui/video/player/status";
import playerView from "#ui/video/player";
import queuePanel from "#ui/video/queue";

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
        const indexS = urlParams.get("pi") || "0";
        const index = Number(indexS);
        setTimeout(() => queuePanel.loadPlaylist(playlistId, index), 1000);
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
            playerView.videoEl.currentTime = Number(time);
            playerView.audioEl.currentTime = Number(time)
        }, 1000);
    }
}

initParma();
await import("./store/registers");

window.addEventListener("popstate", () => {
    initParma(true);
});