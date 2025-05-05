import { spawnSync } from "child_process";
import { createWriteStream, existsSync } from "fs";
import { chmod, mkdir } from "fs/promises";
import https from "https";
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

function downloadFile(url: string, dest: string) {
    return new Promise<void>((resolve, reject) => {
        const writeStream = createWriteStream(dest);
        https.get(url, (response) => {
            if (response.statusCode !== 200) {
                reject(new Error(`Unable to download yt-dlp: status ${response.statusCode}`));
                return;
            }

            response.pipe(writeStream);

            writeStream.on("finish", () => {
                resolve();
            });

            writeStream.on("error", (err) => {
                reject(err);
            });
        }).on("error", (err) => {
            reject(err);
        });
    });
}

export async function getYtDlpPath(): Promise<string> {
    const systemPath = checkSystemYtDlp();
    if (systemPath) return systemPath;

    const homeDir = os.homedir();
    const baseDir = process.platform === "win32"
        ? path.join(process.env.APPDATA || "", "yt-dlp")
        : path.join(homeDir, ".local", "share", "yt-dlp");

    await mkdir(baseDir, { recursive: true });

    const binName = process.platform === "win32" ? "yt-dlp.exe" : "yt-dlp";
    const binPath = path.join(baseDir, binName);

    if (existsSync(binPath)) return binPath;

    const url = "https://github.com/yt-dlp/yt-dlp/releases/latest/download/" + binName;

    console.log(`Downloading yt-dlp to: ${binPath}`);
    await downloadFile(url, binPath);

    if (process.platform !== "win32") {
        await chmod(binPath, 0o755);
    }

    return binPath;
}