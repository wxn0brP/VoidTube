import { searchVideo } from "../apiBack";
import { Video, Config } from "./final/types";
import { tokenize } from "./utils";

export interface SearchEntry {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    views: number;
    channel: string;
    channelName: string;
}

export async function buildInitialCandidates(history: Video[], config: Config, maxPerQuery = 5): Promise<SearchEntry[]> {
    if (history.length < config.minHistory) {
        console.log("[VoidTube-alg-buildInitialCandidates] Not enough history. Returning empty array.");
        return [];
    }

    const keywords = getTopKeywordsFromHistory(history, config);

    console.log(`[VoidTube-alg-buildInitialCandidates] Using keywords: ${keywords.join(", ")}`);

    const allResults: SearchEntry[] = [];

    for (const keyword of keywords) {
        const results = await searchVideo(keyword, maxPerQuery);
        console.log(`[VoidTube-alg-buildInitialCandidates] Found ${results.length} videos for "${keyword}"`);
        allResults.push(...results);
    }

    console.log(`[VoidTube-alg-buildInitialCandidates] Found a total of ${allResults.length} videos`);

    const unique = new Map<string, SearchEntry>();
    for (const entry of allResults) {
        unique.set(entry.id, entry);
    }

    console.log(`[VoidTube-alg-buildInitialCandidates] After deduping, found ${unique.size} videos`);

    return [...unique.values()];
}

export function getTopKeywordsFromHistory(history: Video[], config: Config): string[] {
    const freq = new Map<string, number>();

    for (const vid of history) {
        const tokens = [...tokenize(vid.title), ...tokenize(vid.description)];
        for (const token of tokens) {
            freq.set(token, (freq.get(token) ?? 0) + 1);
        }
    }

    return [...freq.entries()]
        .filter(([_, count]) => count >= config.keywordMinFreq)
        .filter(([word]) => !config.irrelevant.includes(word))
        .sort((a, b) => b[1] - a[1])
        .slice(0, config.maxKeywords)
        .map(([word]) => word);
}
