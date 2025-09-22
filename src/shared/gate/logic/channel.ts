import db from "#db";
import { getChannelInfo } from "#relay/apiBack";
import { getTTL } from "#utils";

export async function channelInfo(id: string, update = false) {
    if (!id) return {};
    const channel = await db.cache.findOne<any>("channel", { id });

    if (!update) {
        if (channel) return channel;
    } else {
        // @ts-ignore
        if (channel && channel.ttl > Math.floor(Date.now() / 1000)) {
            return channel;
        }
    }

    const data = await getChannelInfo(id);
    await db.cache.updateOneOrAdd("channel", { id }, {
        ttl: getTTL(),
        ...data
    }, { id_gen: false });

    return data;
}