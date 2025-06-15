import { tokenize } from "../utils";
import { Config, FeedbackMap, Video } from "./types";

export function buildInterestVector(history: Video[], config: Config, feedback: FeedbackMap): Map<string, number> {
    const freqMap = new Map<string, number>();

    for (const vid of history) {
        const tokens = [...tokenize(vid.title), ...tokenize(vid.description)];
        for (const token of tokens) {
            freqMap.set(token, (freqMap.get(token) ?? 0) + 1);
        }
    }

    const sorted = [...freqMap.entries()]
        .filter(([_, count]) => count >= config.keywordMinFreq)
        .sort((a, b) => b[1] - a[1])
        .slice(0, config.maxKeywords);

    const interestVector = new Map<string, number>();

    for (const [tag, freq] of sorted) {
        interestVector.set(tag, freq);
    }

    if (config.userTags) {
        for (const [tag, weight] of config.userTags) {
            interestVector.set(tag, (interestVector.get(tag) ?? 0) + weight);
        }
    }

    for (const [tag, delta] of feedback.entries()) {
        interestVector.set(tag, (interestVector.get(tag) ?? 0) + delta);
    }

    return interestVector;
}
