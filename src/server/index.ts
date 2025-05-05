import FalconFrame from "@wxn0brp/falcon-frame";
import { scssMiddleware } from "./scss";
import VQL from "../shared/vql";
import { parseStringQuery } from "#vql/cpu/string/index";
import { readFileSync } from "fs";

const app = new FalconFrame();
const port = parseInt(process.env.PORT) || 29848;
app.listen(port);

app.use("/css", scssMiddleware);
app.static("/", "public");
app.static("/js", "front/dist");
app.static("/src", "front/src");

app.get("/", (req, res) => {
    let html = "";
    html += readFileSync("public/header.html", "utf-8");

    html += readFileSync("public/nav.html", "utf-8");
    html += readFileSync("public/app.html", "utf-8");

    html += readFileSync("public/footer.html", "utf-8");

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

console.log(`Server started on http://localhost:${port}`);

process.on("unhandledRejection", (reason, p) => {
    console.error("Unhandled Rejection at: Promise", p, "reason:", reason);
});

process.on("uncaughtException", (err) => {
    console.error("Uncaught Exception thrown:", err);
});