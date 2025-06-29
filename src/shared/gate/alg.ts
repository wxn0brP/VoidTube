import { runFeed } from "#algFeed";
import { note } from "#echo/logger";

export async function runFeedVQL() {
    note("[alg", "Running feed...");
    return await runFeed();
}