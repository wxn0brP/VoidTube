import { fetchVQL } from "#gate";
import { VQL_Query_Relation } from "@wxn0brp/vql/vql";
import { Video } from "./final/types";

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

async function fetchHistory() {
    const query: VQL_Query_Relation = {
        r: {
            path: [
                "user",
                "history"
            ],
            relations: {
                info: {
                    path: [
                        "api",
                        "video-static-quick"
                    ],
                }
            },
            many: true,
            search: {}
        }
    };
    return await fetchVQL<HistoryEntry[]>(query);
}

export async function getHistory(): Promise<Video[]> {
    const data = await fetchHistory();

    if (!data) return [];

    return data.sort((a, b) => a.last - b.last).map(v => ({
        id: v._id,
        title: v.info.title,
        description: v.info.title,
        channel: v.info.channel,
    }));
}