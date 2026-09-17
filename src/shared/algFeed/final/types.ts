export interface Video {
	id: string;
	title: string;
	description: string;
	channel: string;
	duration?: number;
	last?: number;
}

export interface Config {
	minHistory: number;
	maxKeywords: number;
	keywordMinFreq: number;
	videoPerTag: number;
	noisePercent: number;
	noiseBoost: number;
	hashTagBoost: number;
	minScore: number;
	irrelevant: string[];
	userTags: [
		string,
		number,
	][];
	maxPerChannel: number;
	recencyWeight: number;
	durationPreference: boolean;
	publishDateBoost: number;
}

export type FeedbackMap = Map<string, number>; // tag => score

export interface SearchEntry {
	id: string;
	title: string;
	thumbnail: string;
	duration: number;
	views: number;
	channel: string;
	channelName: string;
	publishDate?: string;
}

export interface AlgEntry {
	tags: string[];
	score: number;
}

export type FeedEntry = AlgEntry & SearchEntry;
