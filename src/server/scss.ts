import { compile } from "sass";
import path from "path";
import { existsSync } from "fs";
import { RouteHandler } from "@wxn0brp/falcon-frame/dist/types";

export function scssMiddleware(cwd: string): RouteHandler {
    return (req, res, next) => {
        if (!req.url.endsWith(".css")) return next();
        const srcPath = path.join(cwd, "public", req.path.replaceAll("css", "scss"));

        if (!existsSync(srcPath)) {
            console.log("File not found:", srcPath);
            return next();
        }

        try {
            const result = compile(srcPath, { style: "compressed" });
            res.writeHead(200, { "Content-Type": "text/css" });
            res.end(result.css);
        } catch (e) {
            console.log(e);
            next();
        }
    }
}
