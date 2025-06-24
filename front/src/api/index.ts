import loaderView from "#ui/small/loader";
import { mgl } from "../mgl";

import { fetchVQL, initVQLClient } from "@wxn0brp/vql-client";
export { fetchVQL };

initVQLClient({
    hooks: {
        onStart: (query, ctx) => {
            console.debug("[VQL]", query);
            if (!ctx.silent) loaderView.on();
        },
        onEnd: (query, time, res, ctx) => {
            if (!ctx.silent) loaderView.off();
            if (time > 5_000) console.warn("VQL time > 5s", time, "\n", query);
        },
        onError: (query, err) => {
            console.error("[VQL]", query, err);
        }
    }
});

mgl.fetchVQL = fetchVQL;