import db from "#db";
import { note } from "#echo/logger";

clearOldCache();

export async function clearOldCache() {
    note("cache", "Clearing old cache...");
    const dynamicData = await db.cache.find("video-dynamic", {});
    for (const data of dynamicData) {
        if (data.ttl < Math.floor(new Date().getTime() / 1000)) {
            db.cache.remove("video-dynamic", { _id: data._id });
        }
    }
}