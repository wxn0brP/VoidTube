import { createStore } from "@wxn0brp/flanker-ui";
import { mgl } from "../mgl";
import { PlaylistsEntry, VideoCache, VideoInfo } from "../types/video";

const initData = {
    video: null as VideoInfo,
    videoId: "",
    nextVideoId: "",
    selectedVideoUrl: "",
    selectedAudioUrl: "",
    videoChannelName: "",
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
        channel: false,
        feed: false,
        settings: false,
        alg: false,
        subs: false,
    },
    loader: 0,

    playlistsCache: [] as PlaylistsEntry[],
    channelId: "",

    settings: {
        quality: "best",
        recommendations: "10",
        onePlay: true,
    }
}

export const $store = createStore(initData);
mgl.store = $store;

initData.videoMetaCache = {};