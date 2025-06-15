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
    userTags?: Map<string, number>; // user-defined boost for each tag
    configArray?: [string, number][];
};

export type FeedbackMap = Map<string, number>; // tag => score
