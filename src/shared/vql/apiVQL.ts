import { createValtheraAdapter } from "@wxn0brp/vql";
import { download, getChannelInfo, getChannelVideos, getPlaylistIds, getVideoInfo, searchVideo } from "../apiBack";
import db from "../db";
import executorC from "#db/helpers/executor";
import { getRecommended } from "../getRecommended";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

function getTTL() {
    const now = Math.floor(new Date().getTime() / 1000);
    return now + (3600 * 5); // 5 hours
}

const apiExecutor = new executorC();
clearOldCache();

export const YouTubeAdapter = createValtheraAdapter({
    async getCollections() {
        return ["video", "playlist", "channel", "download", "search", "video-static", "channelVideos", "recommendations", "recommendationsData", "self-version", "channelInfo"];
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
            if (collection === "recommendations") return await getRecommended(search.url || search._id);
            if (collection === "recommendationsData") return await getRecommendedData(search.url || search._id, search.limit || 5);
            if (collection === "video-static") return await apiGetVideos(search);
            if (collection === "channelVideos") return await getChannelVideos(search.url || search._id, search.flat ?? true);
            if (collection === "channelInfo") return [await channelInfo(search?.$in?.id?.[0])];
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
            if (collection === "channelInfo") return await channelInfo(search.url || search._id, search.update || false);
        } catch (e) {
            console.error(e);
        }
        return null;
    }
});

async function apiGetVideo(url: string, dynamic = true, staticData?: any) {
    if (staticData !== false) staticData = await db.cache.findOne("video-static", { _id: url });
    if (!dynamic && staticData) return staticData;

    async function fn() {
        const dynamicData = dynamic && await db.cache.findOne("video-dynamic", { _id: url });

        if (dynamic && staticData && dynamicData) {
            if (dynamicData.ttl > Math.floor(new Date().getTime() / 1000)) {
                const data = { ...staticData, ...dynamicData };
                delete data.ttl;
                delete data.url;
                return data;
            } else {
                db.cache.remove("video-dynamic", { url });
            }
        }

        let data: Awaited<ReturnType<typeof getVideoInfo>>;
        try {
            data = await getVideoInfo(url, dynamic);
        } catch {
            console.error("Failed to get video info:", url);
            return null;
        }

        const staticDataPayload = {
            _id: url,
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploadDate: data.uploadDate,
            likes: data.likes,
            views: data.views,
            channel: data.channel,
        };
        await db.cache.updateOneOrAdd("video-static", { url }, staticDataPayload);

        if ("formats" in data && data.formats.length) {
            const dynamicDataPayload = {
                _id: url,
                formats: data.formats,
                ttl: getTTL(),
            };

            await db.cache.add("video-dynamic", dynamicDataPayload);
        } else if (dynamic) {
            console.error("[API-VQL] Failed to get video formats:", url);
        }

        return data;
    }

    return await apiExecutor.addOp(fn);
}

async function clearOldCache() {
    const dynamicData = await db.cache.find("video-dynamic", {});
    for (const data of dynamicData) {
        if (data.ttl < Math.floor(new Date().getTime() / 1000)) {
            db.cache.remove("video-dynamic", { _id: data._id });
        }
    }
}

async function getRecommendedData(id: string, limit: number = 5) {
    const ids = await getRecommended(id);
    const sliced = ids.slice(0, limit);

    const dataRaw = await Promise.all<any>(sliced.map(id => apiGetVideo(id, false)));
    const data = dataRaw.filter(Boolean).map((d, i) => ({
        _id: sliced[i],
        title: d.title,
        thumbnail: d.thumbnail,
        duration: d.duration,
        views: d.views
    }));
    return data;
}

async function downloadVideo(data: { _id: string, format: "mp3" | "mp4" }) {
    const downloadDir = process.env.DOWNLOAD_PATH || "./downloads";
    if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
    await download(data._id, data.format, downloadDir);
    return { path: resolve(downloadDir) }
}

async function apiGetVideos(search: any) {
    const staticData = await db.cache.find("video-static", search);
    const ids = search.$in._id;

    if (ids.length !== staticData.length) {
        const missingIds = ids.filter(id => !staticData.find(d => d._id === id));
        if (missingIds.length) {
            const missingData = await Promise.all(missingIds.map(id => apiGetVideo(id, false, false)));
            staticData.push(...missingData);
        }
    }

    return staticData;
}

async function channelInfo(id: string, update = false) {
    if (!id) return {};
    const channel = await db.cache.findOne("channel", { id });

    if (!update) {
        if (channel) return channel;
    } else {
        if (channel && channel.ttl > Math.floor(Date.now() / 1000)) {
            return channel;
        }
    }

    const data = await getChannelInfo(id);
    await db.cache.updateOneOrAdd("channel", { id }, {
        ttl: getTTL(),
        ...data
    }, {}, {}, false);

    return data;
}