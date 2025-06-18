import { exec } from "child_process";
import { YtFlags, YtResponse } from "./yt.types";
import { checkIsFileEmpty, getYtDlpPath } from "./yt-dlp";
import { log } from "./logger";

let ytDlp: string = "yt-dlp";
try {
    if (process.env.YT_DLP_PATH) {
        ytDlp = process.env.YT_DLP_PATH;
        if (checkIsFileEmpty(ytDlp)) ytDlp = await getYtDlpPath();
    } else
    ytDlp = await getYtDlpPath();
} catch (e) {
    console.error("Error while getting yt-dlp path:", e);
}
if (process.env.NODE_ENV === "development") log("wrapper", `yt-dlp path: ${ytDlp}`);

function camelToKebab(str: string): string {
    return str.replace(/([A-Z])/g, "-$1").toLowerCase();
}

function flagsConvert(flags: YtFlags): string[] {
    return Object.entries(flags)
        .filter(([_, value]) => Boolean(value))
        .map(([key, _]) => `--${camelToKebab(key)}`);
}

async function wrapper<T = YtResponse>(url: string, flags: YtFlags, unknownFlags?: string[]): Promise<T> {
    return new Promise((resolve, reject) => {
        const cmd = `${ytDlp} ${flagsConvert(flags).join(" ")} ${url}` + (unknownFlags ? " " + unknownFlags.join(" ") : "");
        exec(cmd, { maxBuffer: 1024 * 1024 * 100 }, (error, stdout, stderr) => {
            if (stderr) log("wrapper", "Wrapper error:" + stderr);
            if (error) return reject(error);

            if (flags.dumpJson || flags.dumpSingleJson) {
                resolve(JSON.parse(stdout));
            } else {
                resolve(stdout as T);
            }
        });
    })
}

export { wrapper }