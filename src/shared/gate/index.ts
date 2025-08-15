import VQLProcessor from "@wxn0brp/vql";
import db from "#db";
import { YouTubeAdapter } from "./vql";
import { VQLUQ } from "@wxn0brp/vql/vql";

const vqlDb = Object.assign(
    {},
    db,
    {
        api: YouTubeAdapter
    }
);

const VQL = new VQLProcessor(vqlDb);

export default VQL;

export async function fetchVQL<T = any>(query: VQLUQ<T>) {
    const res = await VQL.execute(query, {});
    // @ts-ignore
    if (res.err) throw new Error(res.err);
    return res as T;
}