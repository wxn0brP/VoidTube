import { parseStringQuery } from "#vql/cpu/string/index";
import FalconFrame from "@wxn0brp/falcon-frame";
import { LogLevelName } from "@wxn0brp/wts-logger";
import { existsSync, readFileSync } from "fs";
import VQL from "../shared/vql";
import avatarHandler from "./avatar";

const isDev = process.env.NODE_ENV === "development";

const app = new FalconFrame({
    loggerName: "void-tube-server",
    logLevel: process.env.FALCON_LOG_LEVEL as LogLevelName || isDev ? "INFO" : "ERROR"
});

const port = parseInt(process.env.PORT) || 29848;
app.listen(port);

const __cwd = process.env.APP_PATH || import.meta.dirname + "/../../";
if (isDev) console.log("__cwd:", __cwd);

if (existsSync(__cwd+"public/scss") && existsSync(__cwd+"node_modules/sass")) {
    const { scssMiddleware } = await import("./scss");
    app.use("/css", scssMiddleware(__cwd));
}
app.static("/", __cwd+"public");
app.static("/js", __cwd+"front/dist");
app.static("/src", __cwd+"front/src");

app.get("/", (req, res) => {
    let html = "";
    html += readFileSync(__cwd+"public/header.html", "utf-8");

    html += readFileSync(__cwd+"public/nav.html", "utf-8");
    html += readFileSync(__cwd+"public/app.html", "utf-8");

    html += readFileSync(__cwd+"public/footer.html", "utf-8");

    res.writeHead(200, { "Content-Type": "text/html" });
    res.end(html);
});

app.post("/VQL", async (req, res) => {
    try {
        const query = req.body.query;
        const result = await VQL.execute(query, {});
        if (result && result.err) return result;
        return { err: false, result };
    } catch (e) {
        // console.error(e);
        return { err: true, msg: e.message };
    }
});

app.post("/VQL2", async (req, res) => {
    try {
        const query = req.body.query;
        const result = parseStringQuery(query); 
        return { err: false, result };
    } catch (e) {
        // console.error(e);
        return { err: true, msg: e.message };
    }
});

app.get("/avatar", avatarHandler);

console.log(`Server started on http://localhost:${port}`);

// process.on("unhandledRejection", (reason, p) => {
//     console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
// });

// process.on("uncaughtException", (err) => {
//     console.error("Uncaught Exception thrown:", err);
// });