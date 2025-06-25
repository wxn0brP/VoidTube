import { download } from "#relay/apiBack";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

export async function downloadVideo(data: { _id: string, format: "mp3" | "mp4" }) {
    const downloadDir = process.env.DOWNLOAD_PATH || "./downloads";
    if (!existsSync(downloadDir)) mkdirSync(downloadDir, { recursive: true });
    await download(data._id, data.format, downloadDir);
    return { path: resolve(downloadDir) }
}