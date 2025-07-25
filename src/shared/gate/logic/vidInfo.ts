import db from "#db";
import { getVideoInfo } from "#relay/apiBack";
import { getTTL } from "#utils";
import { note } from "#echo/logger";
import Executor from "#utils/executor";
import { VideoInfo, StaticVideoInfo, DynamicVideoInfo } from "#relay/types";

export const apiExecutor = new Executor();

export async function retrieveVideoData(url: string, dynamic = true, staticData?: any): Promise<VideoInfo | null> {
    if (staticData !== false) staticData = await db.cache.findOne<StaticVideoInfo>("video-static", { _id: url });
    if (!dynamic && staticData) return staticData;

    async function fn(i = 0): Promise<VideoInfo | null> {
        const dynamicData = dynamic && await db.cache.findOne<DynamicVideoInfo>("video-dynamic", { _id: url });

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

        const staticDataPayload: StaticVideoInfo = {
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

        if ("formats" in data && data.formats.length > 3) {
            const dynamicDataPayload: DynamicVideoInfo = {
                _id: url,
                formats: data.formats,
                ttl: getTTL(),
            };

            await db.cache.add("video-dynamic", dynamicDataPayload);
        } else if (dynamic) {
            console.error("[API-VQL] Failed to get video formats:", url);
            if (i < 3) {
                await new Promise(resolve => setTimeout(resolve, 1000));
                note("API-VQL", "Retrying get video formats... (" + (i + 1) + " / 3)");
                return fn(i + 1);
            }
        }
        db.cache.remove("video-static-quick", { _id: url });

        return data;
    }

    return await apiExecutor.add(url, fn, dynamic ? 1 : 0);
}

export async function retrieveVideoData$(search: any): Promise<StaticVideoInfo[]> {
    const staticData = await db.cache.find<StaticVideoInfo>("video-static", search);
    const ids = search.$in._id;

    if (ids.length !== staticData.length) {
        const missingIds = ids.filter(id => !staticData.find(d => d._id === id));
        if (missingIds.length) {
            const missingData = await Promise.all(missingIds.map(id => retrieveVideoData(id, false, false)));
            staticData.push(...missingData.filter(Boolean) as StaticVideoInfo[]);
        }
    }

    return staticData;
}