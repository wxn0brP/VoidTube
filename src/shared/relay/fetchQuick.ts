import { note } from "#echo/logger";
import ky from "ky";

export async function fetchQuick(videoId: string) {
    note("fetchQuick", "Fetching", videoId);
    const html = await ky(`https://www.youtube.com/watch?v=${videoId}`).text();

    const playerRespMatch = html.match(/ytInitialPlayerResponse\s*=\s*({.+?})\s*;/);
    if (!playerRespMatch) throw new Error("ytInitialPlayerResponse not found");

    const playerData = JSON.parse(playerRespMatch[1]);
    const video = playerData?.videoDetails;
    const microformat = playerData?.microformat?.playerMicroformatRenderer;

    if (!video) throw new Error("videoDetails missing");

    const uploadDate = microformat?.uploadDate;
    if (uploadDate) {
        const date = new Date(uploadDate);
        video.uploadDate = date.getFullYear() + (date.getMonth() + 1) + date.getDate();
    }
    const thumbnails = video.thumbnail?.thumbnails;
    let thumbnailUrl = null;
    if (thumbnails) {
        const url = thumbnails[thumbnails.length - 1].url;
        const lastPart = url.split("/").pop().split(".")[0];
        thumbnailUrl = lastPart === "maxresdefault" ? null : lastPart;
    }

    return {
        _id: videoId,
        title: video.title,
        duration: parseInt(video.lengthSeconds || "0", 10),
        channel: microformat?.externalChannelId || null,
        views: parseInt(video.viewCount, 10) || 0,
        uploadDate: microformat?.uploadDate || null,
        thumbnail: thumbnailUrl
    };
}