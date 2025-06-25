import { runFeed, getConfig } from "#algFeed";
import db from "#db";
import { note } from "#echo/logger";

export async function runFeedVQL() {
    note("[alg", "Running feed...");
    return await runFeed();
}

export async function saveConfig() {
    note("alg", "Saving config...");
    const config = await getConfig();
    for (const [name, value] of Object.entries(config)) 
        await db.alg.updateOneOrAdd("cfg", { _id: name }, {}, { v: value });
    return {};
}

saveConfig();