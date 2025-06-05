import { mgl } from "../mgl";
import { $store } from "../store";
import asideView from "./aside";
import playListsModal from "./modal/playlists";
import playListSnapView from "./modal/playListSnap";
import navBarView from "./navBar";
import searchView from "./search";
import searchBarView from "./searchBar";
import loaderView from "./small/loader";
import audioFormatsView from "./video/audioFormat";
import metaControlView from "./video/metaControl";
import playerView from "./video/player";
import videoFormatsView from "./video/videoFormat";
import videoInfoView from "./video/videoInfo";
import channelView from "./view/channel";
import feedView from "./view/feed";
import historyView from "./view/history";
import playListView from "./view/playList";
import playListsView from "./view/playListsView";
import videoView from "./view/videoView";

export const components = [
    playerView,
    videoInfoView,
    searchBarView,
    videoFormatsView,
    audioFormatsView,
    videoView,
    historyView,
    playListView,
    playListsView,
    searchView,
    loaderView,
    metaControlView,
    playListsModal,
    asideView,
    navBarView,
    playListSnapView,
    channelView,
    feedView,
]

components.forEach(component => component.mount());

export function changeView(view: string) {
    const views = $store.view.get();
    for (const key of Object.keys(views)) {
        views[key].set(key === view);
    }
}

mgl.changeView = changeView;