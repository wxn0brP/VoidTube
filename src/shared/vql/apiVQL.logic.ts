import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { download, getChannelInfo, getVideoInfo } from "../apiBack";
import db from "../db";
import Executor from "../executor";

function getTTL() {
    const now = Math.floor(new Date().getTime() / 1000);
    return now + (3600 * 5); // 5 hours
}

export const apiExecutor = new Executor();
clearOldCache();

export async function apiGetVideo(url: string, dynamic = true, staticData?: any) {
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
        } catch (e) {
            if (e.message == "Task canceled") return null;
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

    return await apiExecutor.add(url, fn, dynamic ? 1 : 0);
}

export async function clearOldCache() {
    const dynamicData = await db.cache.find("video-dynamic", {});
    for (const data of dynamicData) {
        if (data.ttl < Math.floor(new Date().getTime() / 1000)) {
            db.cache.remove("video-dynamic", { _id: data._id });
        }
    }
}

export async function downloadVideo(data: { _id: string, format: "mp3" | "mp4" }) {
    const downloadDir = process.env.DOWNLOAD_PATH || "./downloads";
    if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
    await download(data._id, data.format, downloadDir);
    return { path: resolve(downloadDir) }
}

export async function apiGetVideos(search: any) {
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

export async function channelInfo(id: string, update = false) {
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