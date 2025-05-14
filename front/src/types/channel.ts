export interface ChannelInfo {
    id: string;
    short_id: string;
    name: string;
    description: string;
    thumbnails: {
        id: string,
        url: string,
    }[];
    subscribers: number;
}