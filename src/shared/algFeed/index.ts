import { generateFeed } from "./final/feed";
import { Config, FeedbackMap } from "./final/types";
import { buildInitialCandidates } from "./candidates";
import { getHistory } from "./history";
import { getSetting } from "./getSetting";
import db from "../db";
import { log } from "../logger";

export async function getConfig(): Promise<Config> {
    return {
        minHistory:         await getSetting("minHistory",      20),
        maxKeywords:        await getSetting("maxKeywords",     10),
        keywordMinFreq:     await getSetting("keywordMinFreq",  7),
        videoPerTag:        await getSetting("videoPerTag",     5),
        noisePercent:       await getSetting("noisePercent",    10),
        noiseBoost:         await getSetting("noiseBoost",      15),
        hashTagBoost:       await getSetting("hashTagBoost",    3),
        minScore:           await getSetting("minScore",        0),
        irrelevant:         await getSetting("irrelevant",      []).then(v => v.split(",")),
        userTags:           await getSetting("userTags",        []),
    };
}

export async function runFeed() {
    const history = await getHistory();
    log("alg", "Loaded history:", history.length);

    const config = await getConfig();
    log("alg", "Config:", config);

    const feedback: FeedbackMap = new Map();
    const feedbackRaw = await db.alg.find("feedback", {});
    for (const f of feedbackRaw) feedback.set(f._id, f.v);

    const candidates = await buildInitialCandidates(history, config);
    const feed = generateFeed(history, candidates, config, feedback);

    log("alg", "Final feed:", feed.length);

    return feed;
}

// applyFeedback(feed[0], feedback, +1); // like
// applyFeedback(feed[1], feedback, -1); // dislike
