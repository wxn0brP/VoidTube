import { generateFeed } from "./final/feed";
import { Config, FeedbackMap, Video } from "./final/types";
import { buildInitialCandidates } from "./candidates";
import { getHistory } from "./history";
import { getSetting } from "./getSetting";
import { db } from "#db";
import { note } from "#echo/logger";
import { applyFeedback } from "./fallback";

export async function getConfig(): Promise<Config> {
	return {
		minHistory: await getSetting("minHistory", 20),
		maxKeywords: await getSetting("maxKeywords", 10),
		keywordMinFreq: await getSetting("keywordMinFreq", 7),
		videoPerTag: await getSetting("videoPerTag", 5),
		noisePercent: await getSetting("noisePercent", 10),
		noiseBoost: await getSetting("noiseBoost", 15),
		hashTagBoost: await getSetting("hashTagBoost", 3),
		minScore: await getSetting("minScore", 0),
		irrelevant: await getSetting("irrelevant", "").then(v =>
			Array.isArray(v) ? v : v.split(","),
		),
		userTags: await getSetting("userTags", []),
		maxPerChannel: await getSetting("maxPerChannel", 3),
		recencyWeight: await getSetting("recencyWeight", 2),
		durationPreference: await getSetting("durationPreference", true),
		publishDateBoost: await getSetting("publishDateBoost", 5),
	};
}

export async function runFeed() {
	const history = await getHistory();
	note("alg", "Loaded history:", history.length);

	const config = await getConfig();
	note("alg", "Config:", config);

	const feedback: FeedbackMap = new Map();
	const feedbackRaw = await db.alg.feedback.find();
	for (const f of feedbackRaw) feedback.set(f._id, f.v);

	const candidates = await buildInitialCandidates(history, config);
	const feed = generateFeed(history, candidates, config, feedback);

	note("alg", "Final feed:", feed.length);

	return feed;
}

export async function submitFeedback(videoId: string, delta: number) {
	const history = await getHistory();
	const config = await getConfig();
	const video = history.find(v => v.id === videoId);
	if (!video) return false;

	const feedback: FeedbackMap = new Map();
	const feedbackRaw = await db.alg.feedback.find();
	for (const f of feedbackRaw) feedback.set(f._id, f.v);

	applyFeedback(video as Video, config, feedback, delta);

	for (const [tag, score] of feedback.entries()) {
		await db.alg.feedback.add({
			_id: tag,
			v: score,
		});
	}

	note("alg", `Feedback applied: ${videoId} delta=${delta}`);
	return true;
}
