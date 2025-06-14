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
    noisePercent: number;           // eg. 10%
    noiseBoost: number;             // eg. 15
    userTags: [string, number][];
    irrelevant: string[];           // ignore [the, a, an]
};

export type FeedbackMap = Map<string, number>; // tag => score
