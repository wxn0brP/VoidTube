import { HistoryEntry } from "#types/video";
import { VQL_OP_Find, VQLUQ } from "@wxn0brp/vql-client/vql";
import { fetchVQL } from ".";

export async function updateVideoHistoryTime(id: string, time: number) {
    if (!id || isNaN(time)) return;
    await fetchVQL(`user ~history! s._id = ${id} u.time = ${time}`, { silent: true });
}

export async function fetchVideoHistoryTime(id: string): Promise<number> {
    if (!id) return;
    const res = await fetchVQL(`user history! s._id = ${id}`);
    if (!res) return 0;
    return res.watched ? res.time : 0;
}

export async function fetchHistory(options?: VQL_OP_Find["options"], id?: string) {
    const query: VQLUQ = {
        r: {
            path: ["user", "history"],
            relations: {
                info: {
                    path: ["api", "video-static-quick"],
                    relations: {
                        channelData: {
                            path: ["api", "channelInfo"],
                            pk: "channel",
                            fk: "id",
                            type: "11"
                        }
                    }
                }
            },
            many: true,
            search: {
                watched: true,
                ...(id ? { _id: id } : {}),
            },
            options: options ?? {},
            select: [
                ["_id"],
                ["time"],
                ["last"],
                ["info", "title"],
                ["info", "duration"],
                ["info", "uploadDate"],
                ["info", "views"],
                ["info", "thumbnail"],
                ["info", "channel"],
                ["info", "channelData", "name"],
                ["info", "channelData", "avatar"],
            ]
        }
    }
    return await fetchVQL<HistoryEntry[]>(query);
}