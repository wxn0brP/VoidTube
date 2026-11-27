import { db } from "#db";

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

export async function getStats(): Promise<StatsResult> {
	const history = await db.user.history.find();
	const quick = await db.cache["video-static-quick"].find();
	const quickMap = new Map(
		quick.map(entry => [
			entry._id,
			entry,
		]),
	);
	const channels = new Map<string, ChannelStats>();

	let totalTime = 0;

	for (const entry of history) {
		const info = quickMap.get(entry._id);
		const duration = info?.duration || 0;
		let time = Math.max(0, entry.time || 0);
		if (duration > 0) time = Math.min(time, duration);
		totalTime += time;

		const id = info?.channel || "unknown";
		const channel = channels.get(id) ?? {
			id,
			name: info?.channelName || "Unknown",
			count: 0,
			time: 0,
		};

		channel.count++;
		channel.time += time;
		if (!channel.name && info?.channelName) channel.name = info.channelName;

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
