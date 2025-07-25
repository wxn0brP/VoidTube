import { note } from "#echo/logger";
import ky from "ky";

export async function getSuggestions(query: string, hl = "en", gl = "US"): Promise<string[]> {
    if (!query || !query.trim()) return [];

    try {
        const res = await ky.get("https://suggestqueries.google.com/complete/search", {
            searchParams: {
                client: "firefox",
                ds: "yt",
                q: query,
                hl,
                gl,
            },
            headers: {
                "User-Agent": "Mozilla/5.0",
            },
            timeout: 3000,
        });

        const data = await res.json<any>();
        return Array.isArray(data?.[1]) ? data[1] : [];
    } catch (err) {
        note("suggestions", "fetch failed:", err);
        return [];
    }
}
