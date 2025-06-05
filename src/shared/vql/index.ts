import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";
import db from "../db";
import { YouTubeAdapter } from "./apiVQL.interface";

const vqlConfig = new VQLConfig({
    noCheckPermissions: true,
    strictSelect: false
});

const vqlDb = Object.assign(
    {},
    db,
    {
        api: YouTubeAdapter
    }
);

const VQL = new VQLProcessor(vqlDb, null as any, vqlConfig);

export default VQL;

export async function fetchVQL<T=any>(query: string) {
    const res = await VQL.execute(query, {});
    if (res.err) throw new Error(res.err);
    return res as T;
}