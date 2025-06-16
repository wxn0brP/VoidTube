import { generateFeed } from "./final/feed";
import { Config, FeedbackMap } from "./final/types";
import { buildInitialCandidates } from "./candidates";
import { getHistory } from "./history";
import { getSetting } from "./getSetting";
import db from "../db";

export async function getConfig(): Promise<Config> {
    return {
        minHistory:         await getSetting("minHistory",      20),
        maxKeywords:        await getSetting("maxKeywords",     10),
        keywordMinFreq:     await getSetting("keywordMinFreq",  7),
        videoPerTag:        await getSetting("videoPerTag",     5),
        noisePercent:       await getSetting("noisePercent",    10),
        noiseBoost:         await getSetting("noiseBoost",      15),
        irrelevant:         await getSetting("irrelevant",      []).then(v => v.split(",")),
        userTags:           await getSetting("userTags",        []),
    };
}

export async function runFeed() {
    const history = await getHistory();
    console.log("[VoidTube-alg] Loaded history:", history.length);

    const config = await getConfig();
    console.log("[VoidTube-alg] Config:", config);

    const feedback: FeedbackMap = new Map();
    const feedbackRaw = await db.alg.find("feedback", {});
    for (const f of feedbackRaw) feedback.set(f._id, f.v);

    const candidates = await buildInitialCandidates(history, config);
    const feedRaw = generateFeed(history, candidates, config, feedback);
    const candidatesMap = new Map(candidates.map(v => [v.id, v]));
    const feed = feedRaw.map(v => candidatesMap.get(v.id)!);

    console.log("[VoidTube-alg] Final feed:", feed.length);

    return feed;
}

// applyFeedback(feed[0], feedback, +1); // like
// applyFeedback(feed[1], feedback, -1); // dislike
