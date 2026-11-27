import { fetchVQL } from "#gate";
import { VQL_Query_Relation } from "@wxn0brp/vql/types/vql";
import { Video } from "./final/types";

export interface HistoryInfo {
	title: string;
	description?: string | null;
	duration?: number | null;
	uploadDate?: string | null;
	views?: number | null;
	thumbnail?: string | null;
	channel?: string | null;
	channelData?: {
		name: string;
		avatar: string;
	};
}

export interface HistoryEntry {
	_id: string;
	time?: number;
	watched?: boolean;
	last?: number;
	info?: HistoryInfo;
}

type HistoryEntryWithInfo = HistoryEntry & {
	info: HistoryInfo;
};

function hasInfo(entry: HistoryEntry): entry is HistoryEntryWithInfo {
	return !!entry.info;
}

async function fetchHistory() {
	const query: VQL_Query_Relation = {
		r: {
			path: [
				"user",
				"history",
			],
			relations: {
				info: {
					path: [
						"api",
						"video-static-quick",
					],
				},
			},
			many: true,
			search: {},
		},
	};
	return await fetchVQL<HistoryEntry[]>(query);
}

export async function getHistory(): Promise<Video[]> {
	const data = await fetchHistory();

	if (!data) return [];

	return data
		.filter(hasInfo)
		.sort((a, b) => (a.last ?? 0) - (b.last ?? 0))
		.map(v => ({
			id: v._id,
			title: v.info.title,
			description: v.info.description ?? "",
			duration: v.info.duration ?? 0,
			channel: v.info.channel ?? "",
			last: v.last,
		}));
}
