import { compile } from "sass";
import path from "path";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { RouteHandler } from "@wxn0brp/falcon-frame/dist/types";

export const scssMiddleware: RouteHandler = (req, res, next) => {
    if(!req.url.endsWith(".css")) return next();
    const srcPath = path.join("public", req.path.replaceAll("css", "scss"));
    const distPath = path.join("public", req.path);
    
    if(!existsSync(srcPath)) return next();

    try{
        const result = compile(srcPath, { style: "compressed" });
        mkdirSync(path.dirname(distPath), { recursive: true });
        writeFileSync(distPath, result.css);
    }catch(e){
        console.log(e);
    }

    next();
}
