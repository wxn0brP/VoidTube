import { createValtheraAdapter } from "@wxn0brp/vql";
import { runFeedVQL, saveConfig } from "../alg";
import { getChannelVideos, getPlaylistIds, searchVideo } from "../apiBack";
import { getFeed, getQuickFeed } from "../feed";
import { getRecommended } from "../getRecommended";
import { apiExecutor, apiGetVideo, apiGetVideos, channelInfo, downloadVideo } from "./apiVQL.logic";
import { seeLogs } from "../logger";

export const YouTubeAdapter = createValtheraAdapter({
    async getCollections() {
        return ["video", "playlist", "channel", "download", "search", "video-static", "channelVideos", "recommendations", "recommendationsData", "self-version", "channelInfo", "video-load", "channelFeed", "quickFeed", "algSave", "algRun"];
    },

    async add(collection, data) {
        try {
            if (collection === "download") return await downloadVideo(data);
            if (collection === "algSave") return await saveConfig();
        } catch (e) {
            console.error(e);
        }
        return {};
    },

    async find(collection, search) {
        try {
            if (collection === "playlist") return await getPlaylistIds(search.url || search._id);
            if (collection === "recommendations") return await getRecommended(search.url || search._id, search.limit || 10);
            if (collection === "video-static") return await apiGetVideos(search);
            if (collection === "channelVideos") return await getChannelVideos(search.url || search._id, search.flat ?? true);
            if (collection === "channelFeed") return await getFeed(search.url || search._id);
            if (collection === "quickFeed") return await getQuickFeed();
        } catch (e) {
            console.error(e);
        }
        return [];
    },

    async findOne(collection, search) {
        try {
            if (collection === "video") return await apiGetVideo(search.url || search._id);
            if (collection === "video-static") return await apiGetVideo(search.url || search._id, false);
            if (collection === "search") return await searchVideo(search.q || search.query, search.size || 10);
            if (collection === "self-version") return { version: process.env.VOIDTUBE_VERSION || "unknown" };
            if (collection === "channelInfo") return await channelInfo(search.url || search._id || search.id, search.update || false);
            if (collection === "algRun") return await runFeedVQL();
            if (collection === "seeLogs") return seeLogs();
        } catch (e) {
            console.error(e);
        }
        return null;
    },

    async removeOne(collection, search) {
        try {
            if (collection === "video-load") return apiExecutor.cancel(search.id || search._id || search.url);
        } catch (e) {
            console.error(e);
        }
        return false;
    },

    async remove(collection, search) {
        try {
            if (collection === "video-load") return apiExecutor.cancelLevel(0);
        } catch (e) {
            console.error(e);
        }
        return false;
    },
}, true);