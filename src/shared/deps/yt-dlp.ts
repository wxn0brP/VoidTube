import { note } from "#echo/logger";
import { spawnSync } from "child_process";
import { existsSync, readFileSync, statSync, unlinkSync } from "fs";
import { chmod, mkdir, writeFile } from "fs/promises";
import ky from "ky";
import os from "os";
import path from "path";

function checkSystemYtDlp() {
    const cmd = process.platform === "win32" ? "where" : "which";
    const result = spawnSync(cmd, ["yt-dlp"], { encoding: "utf-8" });

    if (result.status === 0) {
        return result.stdout.trim().split("\n")[0];
    }
    return null;
}

async function downloadFile(url: string, dest: string): Promise<void> {
    const buffer = await ky.get(url).arrayBuffer();
    await writeFile(dest, Buffer.from(buffer));
}

export function checkIsFileEmpty(filePath: string): boolean {
    if (!existsSync(filePath)) return true;
    const stats = statSync(filePath);
    return stats.size < 100;
}

async function getLatestVersion(): Promise<string> {
    const url = "https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest";
    const res = await ky.get(url).json<{ tag_name: string }>();
    return res.tag_name;
}

export async function getYtDlpPath(): Promise<string> {
    const systemPath = checkSystemYtDlp();
    if (systemPath && !checkIsFileEmpty(systemPath)) return systemPath;

    const homeDir = os.homedir();
    const baseDir = process.platform === "win32"
        ? path.join(process.env.APPDATA || "", "yt-dlp")
        : path.join(homeDir, ".local", "share", "yt-dlp");

    await mkdir(baseDir, { recursive: true });

    const binName = process.platform === "win32"
        ? "yt-dlp.exe"
        : process.platform === "darwin"
            ? "yt-dlp_macos"
            : "yt-dlp_linux";
    const binPath = path.join(baseDir, binName);

    if (!checkIsFileEmpty(binPath)) {
        if (await checkUpdate(binPath)) {
            await downloadYtDlp(binName, binPath, baseDir);
        }
        return binPath;
    }
    
    await downloadYtDlp(binName, binPath, baseDir);
    return binPath;
}

async function downloadYtDlp(binName: string, binPath: string, baseDir: string) {
    if (existsSync(binPath)) unlinkSync(binPath);
    const url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + binName;

    note("wrapper", `Downloading yt-dlp to: ${binPath}`);
    await downloadFile(url, binPath);

    if (process.platform !== "win32") {
        await chmod(binPath, 0o755);
    }

    const version = await getLatestVersion();
    note("wrapper", `yt-dlp version: ${version}`);
    await writeFile(path.join(baseDir, "yt-dlp.version"), version);
}

async function checkUpdate(ytDlp: string) {
    const baseDir = path.dirname(ytDlp);

    const versionPath = path.join(baseDir, "yt-dlp.version");
    if (!existsSync(versionPath)) {
        note("wrapper", `yt-dlp version file not found: ${versionPath}`);
        return true;
    }

    const currentVersion = readFileSync(versionPath, "utf-8").trim();
    const latestVersion = await getLatestVersion();
    if (currentVersion !== latestVersion) {
        note("wrapper", `yt-dlp version mismatch: ${currentVersion} != ${latestVersion}`);
        return true;
    }

    return false;
}