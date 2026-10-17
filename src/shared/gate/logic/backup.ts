import { db } from "#db";
import { note } from "#echo/logger";

export interface BackupPayload {
	version: number;
	exportedAt: number;
	data: Record<string, Record<string, any[]>>;
}

export interface RestoreResult {
	imported: number;
	errors: string[];
}

function stores() {
	return {
		user: db.user,
		playlist: db.playlist,
		alg: db.alg,
		downloads: db.downloads,
		cache: db.cache,
	};
}

export async function exportBackup(): Promise<BackupPayload> {
	const data: Record<string, Record<string, any[]>> = {};

	for (const [storeName, store] of Object.entries(stores())) {
		const collections = await (store as any).getCollections();
		const dump: Record<string, any[]> = {};

		for (const name of collections as string[]) {
			try {
				dump[name] = await (store as any)[name].find();
			} catch (err) {
				note("backup", `Failed to export ${storeName}/${name}:`, err);
				dump[name] = [];
			}
		}

		data[storeName] = dump;
	}

	note("backup", "Backup exported");
	return {
		version: 1,
		exportedAt: Date.now(),
		data,
	};
}

export async function importBackup(
	payload: BackupPayload,
): Promise<RestoreResult> {
	if (!payload || typeof payload !== "object" || !payload.data)
		throw new Error("Invalid backup payload");

	const result: RestoreResult = {
		imported: 0,
		errors: [],
	};

	for (const [storeName, store] of Object.entries(stores())) {
		const collections = payload.data[storeName];
		if (!collections) continue;

		for (const [name, docs] of Object.entries(collections)) {
			const collection = (store as any)[name];
			try {
				await collection.remove({});
				for (const doc of docs) {
					await collection.add(doc);
					result.imported++;
				}
			} catch (err) {
				result.errors.push(`${storeName}/${name}: ${err.message}`);
				note("backup", `Failed to import ${storeName}/${name}:`, err);
			}
		}
	}

	note("backup", `Backup imported (${result.imported} documents)`);
	return result;
}
