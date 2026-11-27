import { db } from "#db";
import { getVideoInfo } from "#relay/apiBack";
import { getTTL } from "#utils";
import { note } from "#echo/logger";
import Executor from "#utils/executor";
import { VideoInfo, StaticVideoInfo, DynamicVideoInfo } from "#relay/types";

export const apiExecutor = new Executor();

type CachedVideoInfo = StaticVideoInfo &
	Partial<DynamicVideoInfo> & {
		url?: string;
	};

export function retrieveVideoData(
	_id: string,
	dynamic: false,
	useCache?: boolean,
): Promise<StaticVideoInfo | null>;
export function retrieveVideoData(
	_id: string,
	dynamic?: boolean,
	useCache?: boolean,
): Promise<VideoInfo | null>;
export async function retrieveVideoData(
	_id: string,
	dynamic = true,
	useCache = true,
): Promise<VideoInfo | null> {
	const staticData = useCache
		? await db.cache["video-static"].findOne({
				_id,
			})
		: null;
	if (!dynamic && staticData) return staticData;

	async function fn(i = 0): Promise<VideoInfo | null> {
		const dynamicData =
			dynamic &&
			(await db.cache["video-dynamic"].findOne({
				_id,
			}));

		if (dynamic && staticData && dynamicData) {
			if (dynamicData.ttl > Math.floor(Date.now() / 1000)) {
				const data: CachedVideoInfo = {
					...staticData,
					...dynamicData,
				};
				delete data.ttl;
				delete data.url;
				return data;
			} else {
				db.cache["video-dynamic"].remove({
					_id,
				});
			}
		}

		let data: Awaited<ReturnType<typeof getVideoInfo>>;
		try {
			data = await getVideoInfo(_id, dynamic);
		} catch (e) {
			if (e.message === "Task canceled") return null;
			console.error("Failed to get video info:", _id);
			return null;
		}

		const staticDataPayload: StaticVideoInfo = {
			_id,
			title: data.title,
			description: data.description,
			thumbnail: data.thumbnail,
			duration: data.duration,
			uploadDate: data.uploadDate,
			likes: data.likes,
			views: data.views,
			channel: data.channel,
			chapters: data.chapters,
		};
		await db.cache["video-static"].updateOneOrAdd(
			{
				_id,
			},
			staticDataPayload,
		);

		if (data.formats && data.formats.length > 3) {
			const dynamicDataPayload: DynamicVideoInfo = {
				_id,
				formats: data.formats,
				ttl: getTTL(),
			};

			await db.cache["video-dynamic"].add(dynamicDataPayload);
		} else if (dynamic) {
			console.error("[API-VQL] Failed to get video formats:", _id);
			if (i < 3) {
				await new Promise(resolve => setTimeout(resolve, 1000));
				note("API-VQL", "Retrying get video formats... (" + (i + 1) + " / 3)");
				return fn(i + 1);
			}
		}
		db.cache["video-static-quick"].remove({
			_id,
		});

		return dynamic ? data : staticDataPayload;
	}

	return await apiExecutor.add(_id, fn, dynamic ? 1 : 0);
}

export async function retrieveVideoData$(search: {
	$in: {
		_id: string[];
	};
}): Promise<StaticVideoInfo[]> {
	const staticData = await db.cache["video-static"].find(search);
	const ids = search.$in._id;

	if (ids.length !== staticData.length) {
		const missingIds = ids.filter(id => !staticData.find(d => d._id === id));
		if (missingIds.length) {
			const missingData = await Promise.all(
				missingIds.map(id => retrieveVideoData(id, false, false)),
			);
			staticData.push(
				...missingData.filter((data): data is StaticVideoInfo => data !== null),
			);
		}
	}

	return staticData;
}
