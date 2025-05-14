import { FFResponse } from "@wxn0brp/falcon-frame/dist/res";
import { FFRequest } from "@wxn0brp/falcon-frame/dist/types";
import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync } from "fs";

const __cwd = process.env.APP_PATH || import.meta.dirname + "/../../";
const dir = __cwd + "internal-db/avatars";

if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

export default function avatarHandler(req: FFRequest, res: FFResponse) {
    const link = req.query.link as string;
    if (!link) 
        return res.status(404).end();

    const url = new URL(link);
    const id = (url.pathname.slice(1)).replaceAll("/", "___");

    if (!existsSync(dir + "/" + id)) {
        try {
            execSync(`curl -o ${dir}/${id} ${link}`);
        } catch (e) {
            console.error(e);
            return res.status(500).end();
        }
    }
    
    res.writeHead(200, { "Content-Type": "image/png" });
    res.end(readFileSync(dir + "/" + id));
}