export interface VideoFormat {
    url: string;
    formatId: string;
    resolution: string | null;
    ext: string;
    fps: number;
    fileSize: number;
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
    channel: string;
    formats?: VideoFormat[];
}

export interface StaticVideoInfo extends Omit<VideoInfo, 'formats'> {
    _id: string;
}

export interface DynamicVideoInfo {
    _id: string;
    formats: VideoFormat[];
    ttl: number;
}

export interface SearchResult {
    title: string;
    id: string;
    thumbnail: string;
    duration: number;
    views: number;
    channel: string;
    channelName: string;
}

export interface PlaylistInfo {
    id: string;
    title: string;
    url: string;
    channel: string;
    channelName: string;
    thumbnail: string;
    duration: number;
    views: number;
}

export interface ChannelInfo {
    short_id: string;
    id: string;
    name: string;
    description: string;
    avatar: string;
    banner: string;
    subscribers: number;
}

export interface ChannelVideo {
    title: string;
    id: string;
    thumbnail: string;
    duration: number;
    views: number;
}

export interface FeedItem {
    title: string;
    pubDate: string;
    author: string;
    authorId: string;
    id: string;
}

export interface QuickVideoInfo {
    _id: string;
    title: string;
    duration: number;
    channel: string | null;
    views: number;
    uploadDate: string | null;
    thumbnail: string | null;
    channelName: string;
}

export interface YoutubeDlOptions {
    dumpSingleJson?: boolean;
    noCheckCertificates?: boolean;
    noWarnings?: boolean;
    preferFreeFormats?: boolean;
    youtubeSkipDashManifest?: boolean;
    skipDownload?: boolean;
    noCheckFormats?: boolean;
    flatPlaylist?: boolean;
    output?: string;
    extractAudio?: boolean;
    audioFormat?: string;
    audioQuality?: string;
    format?: string;
    embedThumbnail?: boolean;
    addMetadata?: boolean;
    [key: string]: any;
}

export interface YoutubeDlResult {
    title: string;
    description: string;
    thumbnail: string;
    duration: number;
    upload_date: string;
    view_count: number;
    like_count: number;
    channel_id: string;
    formats: any[];
    entries: any[];
    id: string;
    channel: string;
    uploader: string;
    thumbnails: any[];
    channel_subscribers_count: number;
    channel_follower_count: number;
    automatic_captions: any;
    name: string;
}
