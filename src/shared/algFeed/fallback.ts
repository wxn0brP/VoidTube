import { Video, FeedbackMap, Config } from "./final/types";
import { getHashTag, tokenize } from "./utils";

export function applyFeedback(video: Video, config: Config, feedback: FeedbackMap, delta: number): void {
    const hashTags = getHashTag(video.description || "", config);
    const tokens = [
        ...tokenize(video.title, config),
        ...tokenize(video.description || "", config),
        ...hashTags
    ];
    const unique = new Set(tokens);

    for (const token of unique) {
        feedback.set(token, (feedback.get(token) ?? 0) + delta);
    }
}
