import { Config } from "./final/types";

export function tokenize(text: string, config: Config): string[] {
    if (!text) return [];
    return text
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 2) // filters out short words like "a", etc.
        .filter(w => !config.irrelevant.includes(w))
}

export function getHashTag(text: string, config: Config): string[] {
    if (!text) return [];
    const match = text.match(/#(\w+)/);
    return match ?
        match.slice(1).filter(w => !config.irrelevant.includes(w)) :
        [];
}