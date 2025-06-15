import { getConfig, runFeed } from "./algFeed";
import db from "./db";

export async function runFeedVQL() {
    console.log("[VoidTube-alg] Running feed...");
    return await runFeed();
}

export async function saveConfig() {
    console.log("[VoidTube-alg] Saving config...");
    const config = await getConfig();
    for (const [name, value] of Object.entries(config)) 
        await db.alg.updateOneOrAdd("cfg", { _id: name }, {}, { v: value });
    return {};
}