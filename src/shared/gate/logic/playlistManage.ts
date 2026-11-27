import { db } from "#db";
import { note } from "#echo/logger";

export type PlaylistManageMode =
	| "reverse"
	| "dedupe"
	| "sortTitle"
	| "sortDate"
	| "removeWatched";

interface PlaylistDoc {
	_id: string;
}

interface QuickMeta {
	title?: string;
	uploadDate?: string | null;
}

export async function managePlaylist(
	id: string,
	mode: PlaylistManageMode,
): Promise<string[]> {
	if (!id) throw new Error("Unknown playlist");

	const collection = (db.playlist as any)[id];
	const docs = (await collection.find()) as PlaylistDoc[];
	if (!docs.length) return [];

	let next = docs;

	switch (mode) {
		case "reverse":
			next = [
				...docs,
			].reverse();
			break;

		case "dedupe": {
			const seen = new Set<string>();
			next = docs.filter(doc => {
				if (seen.has(doc._id)) return false;
				seen.add(doc._id);
				return true;
			});
			break;
		}

		case "sortTitle":
		case "sortDate": {
			const meta = await loadMeta(docs.map(doc => doc._id));
			next = [
				...docs,
			].sort((a, b) => {
				const ma = meta.get(a._id);
				const mb = meta.get(b._id);
				if (mode === "sortTitle")
					return (
						(ma?.title || "").localeCompare(mb?.title || "") ||
						a._id.localeCompare(b._id)
					);
				return (
					(mb?.uploadDate || "").localeCompare(ma?.uploadDate || "") ||
					a._id.localeCompare(b._id)
				);
			});
			break;
		}

		case "removeWatched": {
			const history = await db.user.history.find();
			const watched = new Set(history.map(entry => entry._id));
			next = docs.filter(doc => !watched.has(doc._id));
			break;
		}
	}

	await collection.remove({});
	for (const doc of next)
		await collection.add({
			_id: doc._id,
		});

	note(
		"playlist",
		`Managed ${id} (${mode}): ${docs.length} -> ${next.length} videos`,
	);

	return next.map(doc => doc._id);
}

async function loadMeta(ids: string[]) {
	const map = new Map<string, QuickMeta>();

	await Promise.all(
		ids.map(async id => {
			try {
				const meta = await db.cache["video-static-quick"].findOne({
					_id: id,
				});
				if (meta) map.set(id, meta);
			} catch {}
		}),
	);

	return map;
}
