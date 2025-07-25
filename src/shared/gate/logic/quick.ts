import db from "#db";
import { fetchQuick } from "#relay/fetchQuick";
import { channelInfo } from "./channel";
import { retrieveVideoData } from "./vidInfo";

export async function fetchQuickCache(id: string) {
    const cached = await db.cache.findOne("video-static-quick", { _id: id });
    if (cached) return cached;

    const staticData = await db.cache.findOne<any>("video-static", { _id: id });
    if (staticData) {
        staticData.channelName = await channelInfo(staticData.channel).then(c => c.name);
        return staticData;
    }

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

    const cached = await db.cache.find<any>("video-static-quick", { $in: { _id: search.$in._id } });
    for (const data of cached) {
        map.set(data._id, data);
    }

    const missingIds = search.$in._id.filter(id => !map.has(id));
    const staticData = await db.cache.find<any>("video-static", { $in: { _id: missingIds } });
    const channelName = new Map<string, string>();
    for (const data of staticData) {
        if (channelName.has(data.channel)) {
            data.channelName = channelName.get(data.channel);
        } else {
            data.channelName = (await channelInfo(data.channel)).name;
            channelName.set(data.channel, data.channelName);
        }
        map.set(data._id, data);
    }

    for (const id of search.$in._id) {
        if (map.has(id)) continue;
        let data = map.get(id);
        if (!data) {
            data = await fetchQuick(id);
            await db.cache.add("video-static-quick", data);
        }
        map.set(id, data);
    }

    return search.$in._id.map(id => map.get(id));
}