import { runFeed, submitFeedback } from "#algFeed";
import { note } from "#echo/logger";

export async function runFeedVQL() {
	note("[alg", "Running feed...");
	return await runFeed();
}

export async function submitFeedbackVQL(videoId: string, delta: number) {
	note("[alg", `Submitting feedback: ${videoId} delta=${delta}`);
	return await submitFeedback(videoId, delta);
}
