import { spawn } from "child_process";
import { existsSync, mkdirSync } from "fs";
import { resolve } from "path";
import { db } from "#db";
import { getYtDlpPath } from "#deps/yt-dlp";
import { note } from "#echo/logger";
import { showNotification } from "#echo/notification";
import { fetchQuick } from "./fetchQuick";

export type DownloadFormat = "mp3" | "mp4";

export interface ActiveDownload {
	id: string;
	videoId: string;
	title: string;
	format: DownloadFormat;
	progress: number;
	speed: string;
	eta: string;
	total: string;
	startedAt: number;
	status: "downloading" | "done" | "cancelled" | "error";
	error?: string;
	path?: string;
}

const progressRegex =
	/\[download\]\s+([\d.]+)%\s+of\s+(?:~\s*)?([\d.]+)([A-Za-z]+)(?:,\s+([\d.]+)([A-Za-z]+\/s))?\s*(?:ETA\s+([0-9:]+))?/;

class DownloadManager {
	private active = new Map<string, ActiveDownload>();
	private procs = new Map<string, ReturnType<typeof spawn>>();
	private ytDlpPath = "";

	async start(videoId: string, format: DownloadFormat): Promise<string> {
		const id = Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
		const entry: ActiveDownload = {
			id,
			videoId,
			title: videoId,
			format,
			progress: 0,
			speed: "",
			eta: "",
			total: "",
			startedAt: Date.now(),
			status: "downloading",
		};
		this.active.set(id, entry);

		this.resolveTitle(videoId).then(title => {
			if (this.active.has(id)) entry.title = title;
		});

		this.run(id).catch(err => {
			entry.status = "error";
			entry.error = err?.message || String(err);
			note("downloadManager", "Download failed:", err);
		});

		return id;
	}

	cancel(id: string): boolean {
		const entry = this.active.get(id);
		const proc = this.procs.get(id);
		if (!entry) return false;

		entry.status = "cancelled";
		entry.error = "Cancelled by user";
		if (proc) {
			proc.kill();
			this.procs.delete(id);
		}
		this.active.delete(id);
		this.persist(entry);
		return true;
	}

	statusList(): ActiveDownload[] {
		return [
			...this.active.values(),
		];
	}

	private async run(id: string) {
		const entry = this.active.get(id);
		if (!entry) return;

		const downloadDir =
			process.env.DOWNLOAD_PATH || resolve(process.cwd(), "downloads");
		if (!existsSync(downloadDir))
			mkdirSync(downloadDir, {
				recursive: true,
			});

		const args = [
			"--no-check-certificates",
			"--no-warnings",
			"--newline",
			"--output",
			downloadDir + "/%(title)s.%(ext)s",
		];
		if (entry.format === "mp3") {
			args.push(
				"--extract-audio",
				"--audio-format",
				"mp3",
				"--audio-quality",
				"256K",
			);
		} else {
			args.push("--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4");
		}
		args.push(this.normalizeUrl(entry.videoId));

		if (!this.ytDlpPath) this.ytDlpPath = await getYtDlpPath();

		const proc = spawn(this.ytDlpPath, args, {
			stdio: [
				"ignore",
				"ignore",
				"pipe",
			],
		});
		this.procs.set(id, proc);

		proc.stderr.on("data", (chunk: Buffer) => {
			const lines = chunk.toString().split(/[\r\n]+/);
			for (const line of lines) {
				const match = line.match(progressRegex);
				if (!match) continue;
				entry.progress = parseFloat(match[1]);
				entry.total = match[2] + match[3];
				if (match[4]) entry.speed = match[4] + match[5];
				if (match[6]) entry.eta = match[6];
			}
		});

		proc.on("error", err => {
			entry.status = "error";
			entry.error = err.message;
		});

		proc.on("close", code => {
			this.procs.delete(id);
			this.active.delete(id);
			if (entry.status === "error" || entry.status === "cancelled") return;

			if (code === 0) {
				entry.status = "done";
				entry.progress = 100;
				entry.path = downloadDir;
				this.persist(entry);
				showNotification("VoidTube", `Download finished: ${entry.title}`);
			} else {
				entry.status = "error";
				entry.error = `yt-dlp exited with code ${code}`;
				this.persist(entry);
			}
		});
	}

	private async resolveTitle(videoId: string): Promise<string> {
		try {
			const cached = await db.cache["video-static-quick"].findOne({
				_id: videoId,
			});
			if (cached?.title) return cached.title;
		} catch {}
		try {
			const quick = await fetchQuick(videoId);
			if (quick?.title) return quick.title;
		} catch {}
		return videoId;
	}

	private normalizeUrl(videoId: string): string {
		if (videoId.startsWith("http")) return videoId;
		return `https://www.youtube.com/watch?v=${videoId}`;
	}

	private async persist(entry: ActiveDownload) {
		try {
			await db.downloads.downloads.add({
				_id: entry.id,
				videoId: entry.videoId,
				title: entry.title,
				format: entry.format,
				status: entry.status,
				error: entry.error,
				path: entry.path,
				createdAt: entry.startedAt,
				finishedAt: Date.now(),
			});
		} catch (err) {
			note("downloadManager", "Failed to persist download:", err);
		}
	}
}

export const downloadManager = new DownloadManager();
