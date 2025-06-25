import db from "#db";
import { fetchQuick } from "#relay/fetchQuick";
import { retrieveVideoData } from "./vidInfo";

export async function fetchQuickCache(id: string) {
    const staticData = await db.cache.findOne("video-static", { _id: id });
    if (staticData) return staticData;

    const cached = await db.cache.findOne("video-static-quick", { _id: id });
    if (cached) return cached;

    const data = await fetchQuick(id);
    if (data) {
        await db.cache.add("video-static-quick", data);
        return data;
    } else {
        return retrieveVideoData(id, false, false);
    }
}

export async function fetchQuickCache$(search: { $in: { _id: string[] } }) {
    const map = new Map<string, any>();

    const staticData = await db.cache.find("video-static", search);
    staticData.forEach(data => map.set(data._id, data));

    for (const id of search.$in._id) {
        if (map.has(id)) continue;
        let data = await db.cache.findOne("video-static-quick", { _id: id });
        if (!data) {
            data = await fetchQuick(id);
            await db.cache.add("video-static-quick", data);
        }
        map.set(id, data);
    }

    return search.$in._id.map(id => map.get(id));
}