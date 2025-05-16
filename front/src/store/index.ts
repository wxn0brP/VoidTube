import { mgl } from "../mgl";
import { PlaylistsEntry, VideoCache, VideoInfo } from "../types/video";
import { createStore } from "./store";

const initData = {
    video: null as VideoInfo,
    videoId: "",
    nextVideoId: "",
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
        playlistSnap: false,
        channel: false
    },
    loader: 0,

    playlistsCache: [] as PlaylistsEntry[],
    channelId: "",
}

export const $store = createStore(initData);
mgl.store = $store;

initData.videoMetaCache = {};