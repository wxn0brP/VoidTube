import { seeLogs } from "#echo/logger";
import { getChannelVideos, getPlaylistIds, searchVideo } from "#relay/apiBack";
import { getFeed, getQuickFeed } from "#relay/feed";
import { getRecommended } from "#relay/getRecommended";
import { createValtheraAdapter } from "@wxn0brp/vql";
import { runFeedVQL, saveConfig } from "./alg";
import "./cache";
import { channelInfo } from "./logic/channel";
import { downloadVideo } from "./logic/download";
import { fetchQuickCache, fetchQuickCache$ } from "./logic/quick";
import { apiExecutor, retrieveVideoData, retrieveVideoData$ } from "./logic/vidInfo";
import { getSuggestions } from "#relay/suggestions";

export const YouTubeAdapter = createValtheraAdapter({
    async getCollections() {
        return [
            "playlist",
            "channel",
            "download",
            "search",
            
            "video",
            "video-static",
            "video-static-quick",
            
            "channelVideos",
            "recommendations",
            "recommendationsData",
            "channelInfo",
            
            "channelFeed",
            "quickFeed",
            "algSave",
            "algRun",
            
            "self-version",
            "video-load",
            "seeLogs",
        ];
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
            if (collection === "video-static") return await retrieveVideoData$(search);
            if (collection === "channelVideos") return await getChannelVideos(search.url || search._id, search.flat ?? true);
            if (collection === "channelFeed") return await getFeed(search.url || search._id);
            if (collection === "quickFeed") return await getQuickFeed();
            if (collection === "video-static-quick") return await fetchQuickCache$(search);
            if (collection === "suggestions") return await getSuggestions(search.q || search.query, search.hl || "en", search.gl || "US");
        } catch (e) {
            console.error(e);
        }
        return [];
    },

    async findOne(collection, search) {
        try {
            if (collection === "video") return await retrieveVideoData(search.url || search._id);
            if (collection === "video-static") return await retrieveVideoData(search.url || search._id, false);
            if (collection === "search") return await searchVideo(search.q || search.query, search.size || 10);
            if (collection === "self-version") return { version: process.env.VOIDTUBE_VERSION || "unknown" };
            if (collection === "channelInfo") return await channelInfo(search.url || search._id || search.id, search.update || false);
            if (collection === "algRun") return await runFeedVQL();
            if (collection === "seeLogs") return seeLogs();
            if (collection === "video-static-quick") return await fetchQuickCache(search._id || search.id);
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