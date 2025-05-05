import { exec } from "child_process";
import { YtFlags, YtResponse } from "./yt.types";
import { getYtDlpPath } from "./yt-dlp";

let ytDlp: string = "yt-dlp";
try {
    ytDlp = process.env.YT_DLP || await getYtDlpPath();
} catch (e) {
    console.error("Error while getting yt-dlp path:", e);
}

function camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function flagsConvert(flags: YtFlags): string[] {
    return Object.entries(flags)
        .filter(([_, value]) => Boolean(value))
        .map(([key, _]) => `--${camelToKebab(key)}`);
}

async function wrapper(url: string, flags: YtFlags, unknownFlags?: string[]): Promise<YtResponse> {
    return new Promise((resolve, reject) => {
        const cmd = `${ytDlp} ${flagsConvert(flags).join(" ")} ${url}` + (unknownFlags ? " " + unknownFlags.join(" ") : "");
        exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
            if (stderr) console.log(stderr);
            if (error) return console.error(error);
            resolve(JSON.parse(stdout));
        });
    })
}

export { wrapper }