import { createValtheraAdapter } from "@wxn0brp/vql";
import { getChannelVideos, getPlaylistIds, searchVideo } from "../apiBack";
import { getRecommended } from "../getRecommended";
import { downloadVideo, apiGetVideos, channelInfo, apiGetVideo, apiExecutor } from "./apiVQL.logic";
import { getFeed, getQuickFeed } from "../feed";

export const YouTubeAdapter = createValtheraAdapter({
    async getCollections() {
        return ["video", "playlist", "channel", "download", "search", "video-static", "channelVideos", "recommendations", "recommendationsData", "self-version", "channelInfo", "video-load", "channelFeed", "quickFeed"];
    },

    async add(collection, data) {
        try {
            if (collection === "download") return await downloadVideo(data);
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