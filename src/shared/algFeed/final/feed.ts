import { tokenize } from "../utils";
import { Video, Config, FeedbackMap, SearchEntry, FeedEntry } from "./types";
import { buildInterestVector } from "./vector";

export function generateFeed(
    history: Video[],
    candidates: SearchEntry[],
    config: Config,
    feedback: FeedbackMap
): FeedEntry[] {
    if (history.length < config.minHistory) return [];

    const interestVector = buildInterestVector(history, config, feedback);

    const scored = new Map<string, number>();

    const videos: FeedEntry[] = candidates.map(v => {
        return {
            score: 0,
            tags: [],
            ...v
        }
    });

    for (const video of videos) {
        const score = scoreVideo(video, config, interestVector);
        video.score = score;
        if (score > config.minScore) {
            scored.set(video.id, score);
        }
    }

    injectNoise(videos, scored, config);

    return videos
        .filter(v => scored.has(v.id))
        .sort((a, b) => (scored.get(b.id)! - scored.get(a.id)!));
}

export function injectNoise(candidates: FeedEntry[], scored: Map<string, number>, config: Config): void {
    const sorted = candidates
        .filter(v => !scored.has(v.id))
        .sort(() => Math.random() - 0.5); // shuffle

    const noiseCount = Math.floor(candidates.length * config.noisePercent / 100);
    for (const v of sorted.slice(0, noiseCount)) {
        scored.set(v.id, config.noiseBoost);
    }
}

export function scoreVideo(video: FeedEntry, config: Config, interest: Map<string, number>): number {
    // const tokens = [...video.tags, ...tokenize(video.title), ...tokenize(video.description)];
    const tokens = tokenize(video.title, config);
    video.tags = [...new Set(tokens)];
    let score = 0;

    for (const token of tokens) {
        score += interest.get(token) ?? 0;
    }

    // const ageDays = (Date.now() - video.publishDate.getTime()) / (1000 * 3600 * 24);
    // score += Math.max(0, 10 - ageDays);

    return score;
}
