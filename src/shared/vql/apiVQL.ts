import { createValtheraAdapter } from "@wxn0brp/vql";
import { getPlaylistIds, getVideoInfo, searchVideo } from "../apiBack";
import db from "../db";
import executorC from "#db/executor";
import { getRecomended } from "../getRecomended";

function getTTL() {
    const now = Math.floor(new Date().getTime() / 1000);
    return now + (3600 * 5); // 5 hours
}

const apiExecutor = new executorC();
clearOldCache();

export const YouTubeAdapter = createValtheraAdapter({
    async getCollections() {
        return ["video", "playlist", "channel"];
    },

    async find(collection, search) {
        if (collection === "playlist") return await getPlaylistIds(search.url || search._id);
        if (collection === "recommendations") return await getRecomended(search.url || search._id);
        if (collection === "recommendationsData") return await getRecomendedData(search.url || search._id, search.limit || 5);
        return [];
    },

    async findOne(collection, search) {
        if (collection === "video") return await apiGetVideo(search.url || search._id);
        if (collection === "video-static") return await apiGetVideo(search.url || search._id, false);
        if (collection === "search") return await searchVideo(search.q || search.query, search.size || 10);
        else return null;
    }
});

async function apiGetVideo(url: string, dynamic = true) {
    async function fn() {
        const dynamicData = dynamic && await db.cache.findOne("video-dynamic", { _id: url });
        const staticData = await db.cache.findOne("video-static", { _id: url });

        if (dynamic) {
            if (staticData && dynamicData) {
                if (dynamicData.ttl > Math.floor(new Date().getTime() / 1000)) {
                    const data = { ...staticData, ...dynamicData };
                    delete data.ttl;
                    delete data.url;
                    return data;
                } else {
                    db.cache.remove("video-dynamic", { url });
                }
            }
        } else {
            if (staticData) {
                return staticData;
            }
        }

        const data = await getVideoInfo(url, dynamic);

        const staticDataPayload = {
            _id: url,
            title: data.title,
            description: data.description,
            thumbnail: data.thumbnail,
            duration: data.duration,
            uploadDate: data.uploadDate,
            likes: data.likes,
            views: data.views,
        };
        await db.cache.updateOneOrAdd("video-static", { url }, staticDataPayload);

        if ("formats" in data) {
            const dynamicDataPayload = {
                _id: url,
                formats: data.formats,
                ttl: getTTL(),
            };
    
            await db.cache.add("video-dynamic", dynamicDataPayload);
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

async function getRecomendedData(id: string, limit: number = 5) {
    const ids = await getRecomended(id);
    const slied = ids.slice(0, limit);
    
    const dataRaw = await Promise.all<any>(slied.map(id => apiGetVideo(id, false)));
    const data = dataRaw.map((d, i) => ({
        _id: slied[i],
        title: d.title,
        thumbnail: d.thumbnail,
        duration: d.duration,
        views: d.views
    }));
    return data;
}