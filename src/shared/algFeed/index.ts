import { generateFeed } from "./final/feed";
import { Config, FeedbackMap } from "./final/types";
import { buildInitialCandidates } from "./candidates";
import { getHistory } from "./history";

export async function runFeed(config: Config) {
    if (!config) {
        return console.error("Missing config");
    }
    if (Array.isArray(config.configArray)) {
        config.userTags = new Map(config.configArray);
    }

    const history = await getHistory();
    console.log("[VoidTube-alg] Loaded history:", history.length);

    const feedback: FeedbackMap = new Map();
    const candidates = await buildInitialCandidates(history, config);
    const feedRaw = generateFeed(history, candidates, config, feedback);
    const candidatesMap = new Map(candidates.map(v => [v.id, v]));
    const feed = feedRaw.map(v => candidatesMap.get(v.id)!);

    console.log("[VoidTube-alg] Final feed:", feed.length);

    return feed;
}

// applyFeedback(feed[0], feedback, +1); // like
// applyFeedback(feed[1], feedback, -1); // dislike
