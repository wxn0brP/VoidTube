import { levenshtein } from "#utils";
import { fetchVQL } from "@wxn0brp/vql-client";
import { SearchBarView } from ".";

export function filterWithLevenshtein(query: string, list: string[], maxDistance: number): string[] {
    const lowerQuery = query.toLowerCase();
    return list
        .map(item => ({
            item,
            distance: levenshtein(lowerQuery, item.toLowerCase())
        }))
        .filter(({ distance }) => distance <= maxDistance)
        .sort((a, b) => a.distance - b.distance)
        .map(({ item }) => item);
}

export async function loadSearchHistory(cmp: SearchBarView) {
    const history = await fetchVQL<{ _id: string, last: number }[]>("user search-history");
    cmp.searchHistory = history.sort((a, b) => b.last - a.last).map(d => d._id);
}

export async function saveSearchHistory(cmp: SearchBarView, data = cmp.searchInput.value) {
    await fetchVQL(`user updateOneOrAdd search-history s._id = "${data}" u.last=$_nowShort`, { silent: true });
}