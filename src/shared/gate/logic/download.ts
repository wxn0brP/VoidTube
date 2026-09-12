import { db } from "#db";
import { download } from "#relay/apiBack";
import { downloadManager } from "#relay/downloadManager";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";

export async function downloadVideo(data: {
	_id: string;
	format: "mp3" | "mp4";
}) {
	const downloadDir = process.env.DOWNLOAD_PATH || "./downloads";
	if (!existsSync(downloadDir))
		mkdirSync(downloadDir, {
			recursive: true,
		});
	await download(data._id, data.format, downloadDir);
	return {
		path: resolve(downloadDir),
	};
}

export async function downloadStart(data: {
	_id: string;
	format: "mp3" | "mp4";
}) {
	const id = await downloadManager.start(data._id, data.format);
	return {
		id,
	};
}

export function downloadStatus() {
	return downloadManager.statusList();
}

export function downloadCancel(search: { id?: string; _id?: string }) {
	return downloadManager.cancel(search.id || search._id || "");
}

export async function downloadHistory() {
	const res = await db.downloads.downloads.find();
	return res.sort((a, b) => b.createdAt - a.createdAt);
}

export async function downloadHistoryRm(search: { id?: string; _id?: string }) {
	const id = search.id || search._id;
	if (!id || id === "0") {
		await db.downloads.downloads.remove({});
		return true;
	}
	await db.downloads.downloads.remove({
		_id: id,
	});
	return true;
}
