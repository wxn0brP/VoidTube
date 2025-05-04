import FalconFrame from "@wxn0brp/falcon-frame";
import { scssMiddleware } from "./scss";
import VQL from "../shared/vql";
import { parseStringQuery } from "#vql/cpu/string/index";

const app = new FalconFrame();
const port = parseInt(process.env.PORT) || 29848;
app.listen(port);

app.use("/css", scssMiddleware);
app.static("/", "public");
app.static("/js", "front/dist");

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
