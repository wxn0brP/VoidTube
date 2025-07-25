import db from "#db";
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

export async function fetchQuick(videoId: string): Promise<QuickVideoInfo> {
    if (cache.has(videoId)) return cache.get(videoId)!;
    note("fetchQuick", "Fetching", videoId);
    const html = await ky(`https://www.youtube.com/watch?v=${videoId}`).text();

    const playerRespMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
    if (!playerRespMatch) throw new Error("ytInitialPlayerResponse not found");

    const playerData = JSON.parse(playerRespMatch[1]);
    const video = playerData?.videoDetails;
    const microformat = playerData?.microformat?.playerMicroformatRenderer;

    if (!video) throw new Error("videoDetails missing");

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
        channelName: microformat?.ownerChannelName || ""
    };

    cache.set(videoId, data);
    setTimeout(() => cache.delete(videoId), 10_000);
    return data;
}

export async function clearQuickCache(): Promise<boolean> {
    const history = await db.user.find<QuickVideoInfo>("history", {});
    const list = history.map(h => h._id);
    await db.cache.remove("video-static-quick", { $nin: { _id: list } });
    return true;
}