import { Valthera } from "@wxn0brp/db";
import { getExternalResourcePath } from "#utils/path";
import { note } from "#echo/logger";

note("ValtheraDB", "Database path:", getExternalResourcePath("internal-db"));

const db = {
    user:       new Valthera(getExternalResourcePath("internal-db", "user")),
    video:      new Valthera(getExternalResourcePath("internal-db", "video")),
    playlist:   new Valthera(getExternalResourcePath("internal-db", "playlist")),
    cache:      new Valthera(getExternalResourcePath("internal-db", "cache")),
    alg:        new Valthera(getExternalResourcePath("internal-db", "alg")),
}

export default db;