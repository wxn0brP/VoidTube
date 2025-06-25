import db from "#db";
import { getExternalResourcePath } from "#utils/path";
import { FFResponse } from "@wxn0brp/falcon-frame/res";
import { FFRequest } from "@wxn0brp/falcon-frame/types";
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";

const dir = getExternalResourcePath("internal-db", "avatars");

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

export function avatarHandler(req: FFRequest, res: FFResponse) {
    const link = req.query.link as string;
    if (!link || link === "undefined")
        return res.status(404).end();

    try {
        const url = new URL(link);
        const id = (url.pathname.slice(1)).replaceAll("/", "___");

        if (!existsSync(dir + "/" + id)) {
            execSync(`curl -o ${dir}/${id} ${link}`);
        }

        res.writeHead(200, { "Content-Type": "image/png" });
        res.end(readFileSync(dir + "/" + id));
    } catch (e) {
        console.error("[VoidTube-SERVER] Avatar error:", e);
        return res.status(500).end();
    }
}

export async function avatarTryHandler(req: FFRequest, res: FFResponse) {
    const channel_id = req.query.id as string;
    if (!channel_id || channel_id === "undefined")
        return res.status(404).end();

    const hasCache = await db.cache.findOne("channel", { id: channel_id });
    if (!hasCache) return res.status(404).end();

    req.query.link = hasCache.avatar;
    avatarHandler(req, res);
}