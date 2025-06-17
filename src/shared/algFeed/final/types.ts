export interface Video {
    id: string;
    title: string;
    description: string;
    channel: string;
};

export interface Config {
    minHistory: number;             // eg. 20
    maxKeywords: number;            // eg. 10
    keywordMinFreq: number;         // eg. 7
    videoPerTag: number;            // eg. 5
    noisePercent: number;           // eg. 10%
    noiseBoost: number;             // eg. 15
    irrelevant: string[];           // ignore [the, a, an]
    userTags: [string, number][];   // always search
};

export type FeedbackMap = Map<string, number>; // tag => score

export interface SearchEntry {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    views: number;
    channel: string;
    channelName: string;
}

export interface AlgEntry {
    tags: string[];
    score: number;
}

export type FeedEntry = AlgEntry & SearchEntry; 