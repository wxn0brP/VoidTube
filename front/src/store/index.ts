import { createStore } from "@wxn0brp/flanker-ui";
import { mgl } from "../mgl";
import { PlaylistsEntry, VideoCache, VideoInfo } from "../types/video";
import { SponsorSegment } from "#types/sponsorBlock";

const initData = {
    video: null as VideoInfo,
    videoId: "",
    selectedVideoUrl: "",
    selectedAudioUrl: "",
    videoChannelName: "",
    videoMetaCache: null as { [key: string]: VideoCache },
    recommendedId: "",
    queueLoop: false,

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
        searchLanguage: "en",
        searchCountry: "US",
        sponsorBlock: {
            full: true,
            enabled: true
        },
        antiRecommendationLoop: true,
        alg: {
            minHistory: "20",
            maxKeywords: "10",
            keywordMinFreq: "7",
            videoPerTag: "5",
            noisePercent: "10",
            noiseBoost: "15",
            hashTagBoost: "3",
            minScore: "0",
        }
    },
    lastVideos: [] as string[],

    sponsorBlock: {
        id: "",
        segments: [] as SponsorSegment[]
    }
}

export const $store = createStore(initData);
mgl.store = $store;

initData.videoMetaCache = {};

export function appendLastVideos(id: string | string[]) {
    const ids = Array.isArray(id) ? id : [id];
    const old = $store.lastVideos.get();
    const set = new Set([...old, ...ids]);
    $store.lastVideos.set([...set]);
}