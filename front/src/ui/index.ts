import { mgl } from "../mgl";
import { $store } from "../store";
import asideView from "./aside";
import playListsModal from "./modal/playlists";
import playListSnapView from "./view/playListSnap";
import navBarView from "./navBar";
import searchView from "./view/search";
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
import playListsView from "./view/playListsView";
import videoView from "./view/videoView";
import settingsView from "./view/settings";
import messageView from "./modal/message";
import algView from "./view/alg";
import subsListView from "./view/subsList";
import queuePanel from "./video/queue";
import recommendationPanel from "./video/recommendations";
import queueView from "./view/queues";

export const components = [
    playerView,
    videoInfoView,
    searchBarView,
    videoFormatsView,
    audioFormatsView,
    videoView,
    historyView,
    queuePanel,
    recommendationPanel,
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
    settingsView,
    messageView,
    algView,
    subsListView,
    queueView,
]

components.forEach(component => component.mount());

export function changeView(view: string) {
    const views = $store.view.get();
    for (const key of Object.keys(views)) {
        views[key].set(key === view);
    }
}

mgl.changeView = changeView;