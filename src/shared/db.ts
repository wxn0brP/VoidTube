import { Valthera } from "@wxn0brp/db";

const db = {
    user: new Valthera("internal-db/user"),
    video: new Valthera("internal-db/video"),
    playlist: new Valthera("internal-db/playlist"),
    cache: new Valthera("internal-db/cache"),
}

export default db;