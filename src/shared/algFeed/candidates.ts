import { searchVideo } from "../apiBack";
import { log } from "../logger";
import { Video, Config, SearchEntry } from "./final/types";
import { getHashTag, tokenize } from "./utils";

export async function buildInitialCandidates(history: Video[], config: Config): Promise<SearchEntry[]> {
    if (history.length < config.minHistory) {
        log("alg-buildInitialCandidates", "Not enough history. Returning empty array.");
        return [];
    }

    const keywords = getTopKeywordsFromHistory(history, config);

    log("alg-buildInitialCandidates", `Using keywords: ${keywords.join(", ")}`);

    const allResults: SearchEntry[] = [];

    for (const keyword of keywords) {
        const results = await searchVideo(keyword, config.videoPerTag);
        log("alg-buildInitialCandidates", `Found ${results.length} videos for "${keyword}"`);
        allResults.push(...results);
    }

    log("alg-buildInitialCandidates", `Found a total of ${allResults.length} videos`);

    const unique = new Map<string, SearchEntry>();
    for (const entry of allResults) {
        unique.set(entry.id, entry);
    }

    log("alg-buildInitialCandidates", `After deduping, found ${unique.size} videos`);

    return [...unique.values()];
}

export function getTopKeywordsFromHistory(history: Video[], config: Config): string[] {
    const freq = new Map<string, number>();

    for (const vid of history) {
        const title = tokenize(vid.title, config);
        const tokens = [...title, ...title, ...tokenize(vid.description, config)];
        for (const token of tokens) {
            freq.set(token, (freq.get(token) ?? 0) + 1);
        }
    }

    for (const vid of history) {
        const hashTags = getHashTag(vid.description, config);
        for (const hashTag of hashTags) {
            freq.set(hashTag, (freq.get(hashTag) ?? 0) + config.hashTagBoost);
        }
    }

    return [...freq.entries()]
        .filter(([_, count]) => count >= config.keywordMinFreq)
        .filter(([word]) => !config.irrelevant.includes(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, config.maxKeywords)
        .map(([word]) => word);
}
