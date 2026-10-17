import { db } from "#db";
import { QuickVideoInfo } from "#relay/types";

export interface ChannelStats {
	id: string;
	name: string;
	count: number;
	time: number;
}

export interface StatsResult {
	totalVideos: number;
	totalTime: number;
	perChannel: ChannelStats[];
}

type HistoryDoc = QuickVideoInfo & {
	time?: number;
	watched?: boolean;
	last?: number;
};

export async function getStats(): Promise<StatsResult> {
	const history = (await db.user.history.find()) as HistoryDoc[];
	const channels = new Map<string, ChannelStats>();

	let totalTime = 0;

	for (const entry of history) {
		const duration = entry.duration || 0;
		let time = Math.max(0, entry.time || 0);
		if (duration > 0) time = Math.min(time, duration);
		totalTime += time;

		const id = entry.channel || "unknown";
		const channel = channels.get(id) ?? {
			id,
			name: entry.channelName || "Unknown",
			count: 0,
			time: 0,
		};

		channel.count++;
		channel.time += time;
		if (!channel.name && entry.channelName) channel.name = entry.channelName;

		channels.set(id, channel);
	}

	const perChannel = [
		...channels.values(),
	].sort((a, b) => b.time - a.time || b.count - a.count);

	return {
		totalVideos: history.length,
		totalTime,
		perChannel,
	};
}
