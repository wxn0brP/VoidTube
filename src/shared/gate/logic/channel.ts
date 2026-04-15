import { db } from "#db";
import { getChannelInfo } from "#relay/apiBack";
import { ChannelInfo } from "#relay/types";
import { getTTL } from "#utils";

export async function channelInfo(id: string, update = false): Promise<ChannelInfo> {
    if (!id) return {} as any;
    const channel = await db.cache.channel.findOne({ id });

    if (!update) {
        if (channel) return channel;
    } else {
        if (channel && channel.ttl > Math.floor(Date.now() / 1000)) {
            return channel;
        }
    }

    const data = await getChannelInfo(id);
    await db.cache.channel.updateOneOrAdd({ id }, {
        ttl: getTTL(),
        ...data
    }, { id_gen: false });

    return data;
}
