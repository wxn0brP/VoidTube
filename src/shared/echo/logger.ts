import { appendFileSync, existsSync, mkdirSync, readdirSync, unlinkSync, writeFileSync } from "fs";
import { getExternalResourcePath } from "#utils/path";
import { exec } from "child_process";

const filesPath = getExternalResourcePath("internal-db", "logs");
if (!existsSync(filesPath)) mkdirSync(filesPath, { recursive: true });
const files = readdirSync(filesPath);
const maxAge = 1000 * 60 * 60 * 24;

for (const file of files) {
    const time = file.split(".")[0];
    if (Date.now() - new Date(time).getTime() > maxAge) {
        unlinkSync(getExternalResourcePath("internal-db", "logs", file));
    }
}

const logTime = Math.floor(Date.now() / 1000);
export const file = getExternalResourcePath("internal-db", "logs", logTime + ".log");

writeFileSync(file, "", "utf-8");
export function note(name: string, ...args: any[]) {
    console.log(`[VT/${name}]`, ...args);
    appendFileSync(file, `[VT/${name}] ${args.join(" ")}\n`, "utf-8");
}

note("logger", "Logging to", file);

export function seeLogs() {
    const platform = process.platform;

    if (platform === "win32") {
        exec(`start "" "${file}"`);
    } else if (platform === "darwin") {
        exec(`open "${file}"`);
    } else if (platform === "linux") {
        exec(`xdg-open "${file}"`);
    } else {
        console.error("Platform not supported for opening files");
    }
    return {};
}
