import { db } from "#db";
import { note } from "#echo/logger";
import ky from "ky";
import { QuickVideoInfo } from "./types";

const cache = new Map<string, QuickVideoInfo>();

function padData(num: number, length = 2): string {
	return num.toString().padStart(length, "0");
}

function formatDate(date: Date): string {
	return `${padData(date.getFullYear(), 4)}${padData(date.getMonth() + 1)}${padData(date.getDate())}`;
}

function extractJsonObject(html: string, key: string): any {
	const startMarker = `${key} = {`;
	const startIdx = html.indexOf(startMarker);
	if (startIdx === -1) return null;

	const jsonStart = startIdx + startMarker.length - 1;
	let depth = 0;
	let inString = false;
	let isEscaped = false;

	for (let i = jsonStart; i < html.length; i++) {
		const char = html[i];

		if (isEscaped) {
			isEscaped = false;
			continue;
		}

		if (char === "\\") {
			isEscaped = true;
			continue;
		}

		if (char === '"') {
			inString = !inString;
			continue;
		}

		if (inString) continue;

		if (char === "{") depth++;
		else if (char === "}") {
			depth--;
			if (depth === 0) {
				const jsonStr = html.slice(jsonStart, i + 1);
				try {
					return JSON.parse(jsonStr);
				} catch {
					return null;
				}
			}
		}
	}

	return null;
}

export async function fetchQuick(
	videoId: string,
): Promise<QuickVideoInfo | null> {
	if (cache.has(videoId)) return cache.get(videoId);
	note("fetchQuick", "Fetching", videoId);
	const html = await ky(`https://www.youtube.com/watch?v=${videoId}`).text();

	const playerData = extractJsonObject(html, "ytInitialPlayerResponse");
	if (!playerData) {
		note("fetchQuick", "ytInitialPlayerResponse not found for", videoId);
		return null;
	}

	const playabilityStatus = playerData?.playabilityStatus;
	if (playabilityStatus?.status !== "OK") {
		note(
			"fetchQuick",
			"Video not available:",
			videoId,
			playabilityStatus?.reason,
		);
		return null;
	}

	const video = playerData?.videoDetails;
	const microformat = playerData?.microformat?.playerMicroformatRenderer;

	if (!video) {
		note("fetchQuick", "videoDetails missing for", videoId);
		return null;
	}

	let uploadDate: string | null = microformat?.uploadDate;
	if (uploadDate) uploadDate = formatDate(new Date(uploadDate));

	const thumbnails = video.thumbnail?.thumbnails;
	let thumbnailUrl: string | null = null;
	if (thumbnails) {
		const url = thumbnails[thumbnails.length - 1].url;
		const lastPart = url.split("/").pop().split(".")[0];
		thumbnailUrl = lastPart === "maxresdefault" ? null : lastPart;
	}

	const data: QuickVideoInfo = {
		_id: videoId,
		title: video.title,
		duration: parseInt(video.lengthSeconds || "0", 10),
		channel: microformat?.externalChannelId || null,
		views: parseInt(video.viewCount, 10) || 0,
		uploadDate: uploadDate || null,
		thumbnail: thumbnailUrl,
		channelName: microformat?.ownerChannelName || "",
	};

	cache.set(videoId, data);
	setTimeout(() => cache.delete(videoId), 10_000);
	return data;
}

export async function clearQuickCache(): Promise<boolean> {
	const history = await db.user.history.find();
	const list = history.map(h => h._id);
	// @ts-ignore
	await db.cache["video-static-quick"].remove({
		$nin: {
			_id: list,
		},
	});
	return true;
}
