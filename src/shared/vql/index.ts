import VQLProcessor, { VQLConfig } from "@wxn0brp/vql";
import db from "../db";
import { YouTubeAdapter } from "./apiVQL.interface";

VQLConfig.noCheckPermissions = true;
VQLConfig.strictSelect = false;

const vqlDb = Object.assign(
    {},
    db,
    {
        api: YouTubeAdapter
    }
);

const VQL = new VQLProcessor(vqlDb, null as any);

export default VQL;