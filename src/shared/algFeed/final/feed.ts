import { tokenize } from "../utils";
import { Video, Config, FeedbackMap, SearchEntry, FeedEntry } from "./types";
import { buildInterestVector, calcDurationPreference } from "./vector";

export function generateFeed(
	history: Video[],
	candidates: SearchEntry[],
	config: Config,
	feedback: FeedbackMap,
): FeedEntry[] {
	if (history.length < config.minHistory) return [];

	const interestVector = buildInterestVector(history, config, feedback);
	const seenIds = new Set(history.map(v => v.id));
	const avgDuration = config.durationPreference
		? calcDurationPreference(history)
		: 0;

	const scored = new Map<string, number>();

	const videos: FeedEntry[] = candidates
		.filter(v => !seenIds.has(v.id))
		.map(v => ({
			score: 0,
			tags: [],
			...v,
		}));

	for (const video of videos) {
		const score = scoreVideo(video, config, interestVector, avgDuration);
		video.score = score;
		if (score > config.minScore) {
			scored.set(video.id, score);
		}
	}

	injectNoise(videos, scored, config);

	const result = videos
		.filter(v => scored.has(v.id))
		.sort((a, b) => scored.get(b.id)! - scored.get(a.id)!);

	return applyChannelDiversity(result, config.maxPerChannel);
}

function applyChannelDiversity(
	videos: FeedEntry[],
	maxPerChannel: number,
): FeedEntry[] {
	const channelCount = new Map<string, number>();
	const result: FeedEntry[] = [];

	for (const video of videos) {
		const count = channelCount.get(video.channel) ?? 0;
		if (count < maxPerChannel) {
			result.push(video);
			channelCount.set(video.channel, count + 1);
		}
	}

	return result;
}

export function injectNoise(
	candidates: FeedEntry[],
	scored: Map<string, number>,
	config: Config,
) {
	const sorted = candidates
		.filter(v => !scored.has(v.id))
		.sort(() => Math.random() - 0.5); // shuffle

	const noiseCount = Math.floor(
		(candidates.length * config.noisePercent) / 100,
	);
	for (const v of sorted.slice(0, noiseCount)) {
		scored.set(v.id, config.noiseBoost);
	}
}

export function scoreVideo(
	video: FeedEntry,
	config: Config,
	interest: Map<string, number>,
	avgDuration: number,
): number {
	const tokens = tokenize(video.title, config);
	video.tags = [
		...new Set(tokens),
	];
	let score = 0;

	for (const token of tokens) {
		score += interest.get(token) ?? 0;
	}

	if (avgDuration > 0 && video.duration > 0) {
		const durationDiff = Math.abs(video.duration - avgDuration);
		const durationSimilarity = Math.max(0, 1 - durationDiff / avgDuration);
		score += durationSimilarity * 5;
	}

	if (video.publishDate) {
		const ageDays =
			(Date.now() - new Date(video.publishDate).getTime()) /
			(1000 * 60 * 60 * 24);
		if (!Number.isNaN(ageDays)) {
			score += Math.max(0, config.publishDateBoost - ageDays / 10);
		}
	}

	return score;
}
