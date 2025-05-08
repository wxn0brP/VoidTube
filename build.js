// @ts-check
import { existsSync, mkdirSync, readdirSync, writeFileSync } from "fs";
import { compile } from "sass";

if (!existsSync("public/css")) mkdirSync("public/css");
readdirSync("public/scss").forEach(file => {
    const srcPath = `public/scss/${file}`;
    const output = srcPath.replaceAll("scss", "css");

    const result = compile(srcPath, { style: "compressed" });
    writeFileSync(output, result.css);
});