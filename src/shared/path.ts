import path from "path";
import { fileURLToPath } from "url";

let isElectron = false;
let isPackaged = false;
let basePath = "";

try {
    isElectron = !!process.versions.electron;

    if (isElectron) {
        const { app } = await import("electron");
        isPackaged = app.isPackaged;
        basePath = isPackaged
            ? process.resourcesPath
            : path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
    } else {
        basePath = process.cwd(); // node .
    }
} catch {
    // fallback for pure node if import("electron") fails
    basePath = process.cwd();
}

export function getExternalResourcePath(...segments: string[]): string {
    return path.join(basePath, ...segments);
}
