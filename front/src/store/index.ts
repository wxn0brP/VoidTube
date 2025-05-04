import { VideoCache, VideoInfo } from "../types/video";
import { createStore } from "./store";

const initData = {
    video: null as VideoInfo,
    videoId: "",
    selectedVideoUrl: "",
    selectedAudioUrl: "",
    playlist: [] as string[],
    playlistIndex: 0,
    playlistId: "",
    videoMetaCache: null as { [key: string]: VideoCache },

    view: {
        video: false,
        history: false,
        playlists: false,
        search: false,
    },
    loader: 0,
}

export const $store = createStore(initData);
(window as any).store = $store;

initData.videoMetaCache = {};