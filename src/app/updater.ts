import { showNotification } from "#echo/notification";
import crypto from "crypto";
import fs from "fs";
import ky from "ky";
import path from "path";

const logPrefix = "[VoidTube-quick-updater]";
const manifestUrl = "https://raw.githubusercontent.com/wxn0brP/VoidTube/refs/heads/dist-split/output/manifest.json";

async function downloadAndAssemble(manifestUrl: string, outputDir: string) {
    const manifest = await ky<{
        parts: string[];
        sha256: string;
        commit: string;
    }>(manifestUrl).json();
    console.log(logPrefix, `Retrieved manifest from ${manifestUrl}`);

    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

    const outputFile = path.join(outputDir, "next");
    const gitvvPath = path.join(outputDir, "gitvv");

    console.log(logPrefix, `Output file: ${outputFile} ${fs.existsSync(outputFile)}`);
    console.log(logPrefix, `App commit version file: ${gitvvPath} ${fs.existsSync(gitvvPath)}`);

    // Check current version
    if (fs.existsSync(gitvvPath)) {
        const currentVersion = fs.readFileSync(gitvvPath, "utf-8").trim();
        if (currentVersion === manifest.commit) {
            console.log(logPrefix, `Current version (${currentVersion}) matches manifest. Skipping update.`);
            process.env.VOIDTUBE_VERSION = currentVersion;
            return false;
        } else {
            console.log(logPrefix, `Local version (${currentVersion}) != remote (${manifest.commit}), updating...`);
        }
    }

    try {
        showNotification("VoidTube", "Downloading update...");
    } catch (err) {
        console.error(err);
    }

    const output = fs.createWriteStream(outputFile);

    for (const partName of manifest.parts) {
        const url = new URL(partName, manifestUrl).toString();
        console.log(logPrefix, `Downloading ${url}`);
        const res = await ky.get(url).arrayBuffer();
        const buf = Buffer.from(res);
        output.write(buf);
    }

    output.end();
    await new Promise<void>(resolve => output.on("finish", resolve));

    console.log(logPrefix, `Checking checksum: ${manifest.sha256}.`);
    const hash = crypto.createHash("sha256");
    hash.update(fs.readFileSync(outputFile));
    const digest = hash.digest("hex");
    if (digest !== manifest.sha256) {
        throw new Error(`Checksum mismatch: expected ${manifest.sha256}, got ${digest}`);
    }

    console.log(logPrefix, `Successfully downloaded and assembled ${outputFile} with valid checksum.`);

    // Save new git commit hash
    fs.writeFileSync(gitvvPath, manifest.commit, "utf-8");
    console.log(logPrefix, `Updated version to ${manifest.commit}.`);
    process.env.VOIDTUBE_VERSION = manifest.commit;

    return true;
}

const resourcesDir =
    path.dirname(process.argv[0]).includes("electron") ?
        path.join(import.meta.dirname, "..", "..", "resources") :
        process.resourcesPath;

await downloadAndAssemble(manifestUrl, resourcesDir).then(async update => {
    if (update) {
        await import("./update");
        process.exit(0);
    }
}).catch(err => {
    console.error(logPrefix, "Update failed:", err);
});
