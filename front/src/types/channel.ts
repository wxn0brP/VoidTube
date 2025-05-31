export interface ChannelInfo {
    id: string;
    short_id: string;
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
    history?: {
        time: number;
        _id: string;
    }
}