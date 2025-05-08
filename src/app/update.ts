import { spawn } from "child_process";
import { app } from "electron";
import fs from "fs";
import path from "path";

const winScript = `@echo off
timeout /t 3 /nobreak > nul
cd /d %~dp0
del app.asar > nul 2>&1
rename next app.asar
cd ..
start "" %* &`;

const unixScript = `#!/bin/sh
sleep 3
cd "$(dirname "$0")"
rm -f app.asar
mv next app.asar
cd ..
exec "$@" &`;

const resourcesDir =
    path.dirname(process.argv[0]).includes("electron") ?
        path.join(import.meta.dirname, "..", "..", "resources") :
        process.resourcesPath;

if (!fs.existsSync(resourcesDir)) fs.mkdirSync(resourcesDir, { recursive: true });

function ensureUpdateScripts() {
    if (process.platform === "win32") {
        const winScriptPath = path.join(resourcesDir, "updater.cmd");
        fs.writeFileSync(winScriptPath, winScript, "utf-8");
    } else {
        const unixScriptPath = path.join(resourcesDir, "updater.sh");
        fs.writeFileSync(unixScriptPath, unixScript, { encoding: "utf-8", mode: 0o755 });
    }
}

function launchUpdateProcess() {
    const isWin = process.platform === "win32";

    const script = isWin
        ? path.join(resourcesDir, "updater.cmd")
        : path.join(resourcesDir, "updater.sh");

    const updater = spawn(
        isWin ? "cmd" : "sh",
        isWin ? ["/c", script, ...process.argv] : [script, ...process.argv],
        {
            detached: true,
            stdio: "ignore"
        }
    );

    updater.unref();
    app.exit();
}

if (fs.existsSync(path.join(resourcesDir, "next"))) {
    ensureUpdateScripts();
    launchUpdateProcess();
}