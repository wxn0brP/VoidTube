import { note } from "#echo/logger";
import VQL from "#gate";
import { parseStringQuery } from "@@vql/cpu/string/index";
import FalconFrame from "@wxn0brp/falcon-frame";
import { LogLevelName } from "@wxn0brp/lucerna-log";
import { avatarHandler, avatarTryHandler } from "./avatar";

const isDev = process.env.NODE_ENV === "development";

const app = new FalconFrame({
    loggerName: "VoidTube-SERVER",
    logLevel: process.env.FALCON_LOG_LEVEL as LogLevelName || (isDev ? "INFO" : "ERROR")
});
if (isDev) note("server", "FalconFrame started with", app.logger.logLevel, "debug level");

const port = parseInt(process.env.PORT) || 29848;

const __cwd = process.env.APP_PATH || import.meta.dirname + "/../../";
if (isDev) note("server", "__cwd:", __cwd);

app.get("/", (req, res) => {
    res.render(__cwd + "public/index.html", {});
});

app.static("/", __cwd + "public");
app.static("/js", __cwd + "front/dist");
app.static("/src", __cwd + "front/src");

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
app.get("/avatarTry", avatarTryHandler);

note(`server`, `Server started on http://localhost:${port}`);

process.on("unhandledRejection", (reason, p) => {
    note("server", "Unhandled Rejection at: Promise", p, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    note("server", "Uncaught Exception thrown:", err.message, err.stack);
});

app.listen(port);