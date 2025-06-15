import db from "./db";
import { runFeed } from "./algFeed";
import { Config } from "./algFeed/final/types";
import { stringify } from "#db/helpers/format.js";

export const configRaw: Config = {
    minHistory: 20,
    maxKeywords: 10,
    keywordMinFreq: 7,
    noisePercent: 10,
    noiseBoost: 15,
};

async function saveConfig() {
    for (const [key, obj] of Object.entries(configRaw)) {
        await db.user.updateOneOrAdd("alg_conf", { _id: key }, {}, { value: obj });
    }
    
    await db.user.updateOneOrAdd("alg_conf", { _id: "configArray" }, {}, { value: [] });
    console.log("[VoidTube-alg] Saved config: ", stringify(configRaw));
}

export async function loadConfig(){
    const configDb = await db.user.find("alg_conf", {});
    configDb.forEach(data => {
        configRaw[data._id] = data.value;
    });
    console.log("[VoidTube-alg] Loaded config: ", stringify(configRaw));
}


export async function runFeedVQL() {
    console.log("[VoidTube-alg] Running feed...");
    return await runFeed(configRaw);
}

saveConfig();