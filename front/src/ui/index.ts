import { $store } from "../store";
import audioFormatsView from "./audioFormat";
import historyView from "./history";
import playerView from "./player";
import playListView from "./playList";
import playListsView from "./playListsView";
import searchView from "./search";
import searchBarView from "./searchBar";
import videoFormatsView from "./videoFormat";
import videoInfoView from "./videoInfo";
import videoView from "./videoView";
import loaderView from "./loader";
import metaControlView from "./metaControl";
import { mgl } from "../mgl";
import playListsModal from "./modal/playlists";
import asideView from "./aside";
import navBarView from "./navBar";
import playListSnapView from "./playListSnap";
import channelView from "./channel";

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
]

components.forEach(component => component.mount());

export function changeView(view: string) {
    const views = $store.view.get();
    for (const key of Object.keys(views)) {
        views[key].set(key === view);
    }
}

mgl.changeView = changeView;