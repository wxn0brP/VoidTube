import db from "#db";
import { getChannelInfo } from "#relay/apiBack";
import { getTTL } from "#utils";

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