import { getHashTag, tokenize } from "../utils";
import { Config, FeedbackMap, Video } from "./types";

export function buildInterestVector(
	history: Video[],
	config: Config,
	feedback: FeedbackMap,
): Map<string, number> {
	const freqMap = new Map<string, number>();
	const now = Date.now();

	for (const vid of history) {
		const recencyBoost = calcRecencyWeight(vid.last, now, config.recencyWeight);
		const hashTags = getHashTag(vid.description || "", config);
		const tokens = [
			...tokenize(vid.title, config),
			...tokenize(vid.description || "", config),
		];
		for (const token of tokens) {
			freqMap.set(token, (freqMap.get(token) ?? 0) + recencyBoost);
		}

		for (const hashTag of hashTags) {
			freqMap.set(
				hashTag,
				(freqMap.get(hashTag) ?? 0) + config.hashTagBoost * recencyBoost,
			);
		}
	}

	const sorted = [
		...freqMap.entries(),
	]
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

function calcRecencyWeight(
	last: number | undefined,
	now: number,
	recencyWeight: number,
): number {
	if (!last) return 1;
	const daysSince = (now - last) / (1000 * 60 * 60 * 24);
	return 1 + recencyWeight / (daysSince + 1);
}

export function calcDurationPreference(history: Video[]): number {
	const durations = history
		.filter(v => v.duration && v.duration > 0)
		.map(v => v.duration);
	if (!durations.length) return 0;
	return durations.reduce((a, b) => a + b, 0) / durations.length;
}
