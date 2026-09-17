import { Config } from "./final/types";

export function tokenize(text: string, config: Config): string[] {
	if (!text) return [];
	return text
		.toLowerCase()
		.replace(/[^a-z0-9\s]/g, "")
		.split(/\s+/)
		.filter(w => w.length > 2)
		.filter(w => !config.irrelevant.includes(w));
}

export function getHashTag(text: string, config: Config): string[] {
	if (!text) return [];
	const matches = text.matchAll(/#(\w+)/g);
	return [
		...matches,
	]
		.map(m => m[1].toLowerCase())
		.filter(w => !config.irrelevant.includes(w));
}
