import loaderView from "#ui/loader";
import { mgl } from "../mgl";

const middleTime: number[] = [];

export async function fetchVQL<T=any>(query: string | object): Promise<T> {
    loaderView.on();
    const start = Date.now();
    const response = await fetch(`/VQL`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    }).then(res => res.json());

    if (response.err) {
        console.error(query, response);
        throw new Error(response.err);
    }

    const end = Date.now();
    const time = end - start;
    if (time > 5_000) console.warn("VQL time > 5s", time, "\n", query);
    middleTime.push(time);

    console.debug(query, response?.result || response, time);
    loaderView.off();

    return response?.result;
}

export function logVQLTime() {
    const time =  middleTime.reduce((a, b) => a + b, 0) / middleTime.length;
    const seconds = Math.round(time / 100) / 10;
    console.log("VQL middle time " + Math.floor(time) + "ms", "s =", seconds + "s");
}
mgl.fetchVQL = fetchVQL;
mgl.logVQLTime = logVQLTime;