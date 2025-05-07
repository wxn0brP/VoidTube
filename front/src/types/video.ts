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
    duration: number;
}

export interface SearchEntry {
    id: string;
    title: string;
    thumbnail: string;
    duration: number;
    views: number;
}

export interface RecommendationEntry {
    _id: string;
    title: string;
    thumbnail: string;
    duration: number;
    views: number;
}