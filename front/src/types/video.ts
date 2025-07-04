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
}

export interface VideoCache {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    uploadDate: string;
    views: number;
}

export interface HistoryEntry {
    _id: string;
    time: number;
    watched: boolean;
    last: number;
    info: {
        title: string;
        duration: number;
        uploadDate: string;
        views: number;
        thumbnail: string;
        channel: string;
        channelData: {
            name: string;
            avatar: string;
        }
    };
}

export interface PlaylistEntry {
    _id: string;
    time: number;
    info: {
        title: string;
        duration: number;
        thumbnail: string;
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
    info: {
        title: string;
        duration: number;
        thumbnail: string;
        views: number;
    };
    history: {
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
    history: {
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