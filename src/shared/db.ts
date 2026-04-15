import { note } from "#echo/logger";
import { ChannelInfo, DynamicVideoInfo, QuickVideoInfo, StaticVideoInfo } from "#relay/types";
import { getExternalResourcePath } from "#utils/path";
import { ValtheraCreate } from "@wxn0brp/db";

note("ValtheraDB", "Database path:", getExternalResourcePath("internal-db"));

export const db = {
    user: ValtheraCreate<{
        settings: { v: any };
        subs: { _id: string, last: number };
        history: QuickVideoInfo;
    }>(getExternalResourcePath("internal-db", "user")),

    video: ValtheraCreate(getExternalResourcePath("internal-db", "video")),

    playlist: ValtheraCreate(getExternalResourcePath("internal-db", "playlist")),

    cache: ValtheraCreate<{
        channel: ChannelInfo & { ttl?: number };
        "video-dynamic": DynamicVideoInfo;
        "video-static": StaticVideoInfo;
        "video-static-quick": QuickVideoInfo;
    }>(getExternalResourcePath("internal-db", "cache")),

    alg: ValtheraCreate<{
        feedback: { _id: string, v: number }
    }>(getExternalResourcePath("internal-db", "alg")),
}
