import { Video, FeedbackMap } from "./final/types";
import { tokenize } from "./utils";

export function applyFeedback(video: Video, feedback: FeedbackMap, delta: number): void {
    const tokens = [...tokenize(video.title), ...tokenize(video.description)];
    const unique = new Set(tokens);

    for (const token of unique) {
        feedback.set(token, (feedback.get(token) ?? 0) + delta);
    }
}
