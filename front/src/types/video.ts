export interface Format {
	url: string;
	formatId: string;
	resolution?: string;
	ext: string;
	fps?: number;
	fileSize?: number;
	is_video: boolean;
	is_audio: boolean;
}

export interface Chapter {
	title: string;
	start_time: number;
	end_time?: number;
}

export interface VideoInfo {
	title: string;
	description: string;
	thumbnail: string;
	duration: number;
	uploadDate: string;
	views: number;
	likes: number;
	formats: Format[];
	channel: string;
	chapters?: Chapter[];
}

export interface VideoCache {
	id: string;
	title: string;
	thumbnail: string;
	duration: number;
	uploadDate: string;
	views: number;
}

export interface HistoryEntryInfo {
	title: string;
	duration: number;
	uploadDate?: string | null;
	views: number;
	thumbnail?: string | null;
	channel?: string | null;
	channelData?: {
		name: string;
		avatar?: string;
	};
}

export interface HistoryEntry {
	_id: string;
	time: number;
	watched: boolean;
	last: number;
	info?: HistoryEntryInfo;
}

export interface PlaylistEntry {
	_id: string;
	time: number;
	info?: {
		title: string;
		duration: number;
		thumbnail?: string | null;
	};
}

export interface PlaylistsEntry {
	_id: string;
	name: string;
	last: number;
	videosCount: number;
	thumbnail: string;
}

export interface SearchEntry {
	id: string;
	title: string;
	thumbnail: string;
	duration: number;
	views: number;
	channel: string;
	channelName: string;
}

export interface PlaylistSnapEntry {
	_id: string;
	time: number;
	info?: {
		title: string;
		duration: number;
		thumbnail?: string | null;
		views: number;
	};
	history?: {
		time: number;
	};
}

export interface FeedEntry {
	title: string;
	pubDate: string;
	author: string;
	authorId: string;
	id: string;
	channel: {
		avatar: string;
	};
	history?: {
		time: number;
	};
}

export interface AlgEntry {
	id: string;
	title: string;
	thumbnail: string;
	duration: number;
	views: number;
	channel: string;
	channelName: string;
	score: number;
	tags: string[];
}

export interface VideoQuickInfo {
	_id: string;
	title: string;
	duration: number;
	channel: string;
	thumbnail: string | null;
	views: number;
	channelName: string;
}

export interface LoadVideoOpts {
	autoPlay: boolean;
	saveProgressOpt: boolean;
	saveNav: boolean;
}

export type DownloadFormat = "mp3" | "mp4";

export interface ActiveDownload {
	id: string;
	videoId: string;
	title: string;
	format: DownloadFormat;
	progress: number;
	speed: string;
	eta: string;
	total: string;
	startedAt: number;
	status: "downloading" | "done" | "cancelled" | "error";
	error?: string;
	path?: string;
}

export interface DownloadEntry {
	_id: string;
	videoId: string;
	title: string;
	format: DownloadFormat;
	status: string;
	error?: string;
	path?: string;
	createdAt: number;
	finishedAt?: number;
}
