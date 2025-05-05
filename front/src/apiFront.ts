import { mgl } from "./mgl";
import { HistoryEntry, PlaylistEntry, PlaylistsEntry, VideoInfo } from "./types/video";
import loaderView from "./ui/loader";

const middleTime: number[] = [];

export async function fetchVQL(query: string | object) {
    loaderView.on();
    const start = Date.now();
    const response = await fetch(`/VQL`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
    }).then(res => res.json());

    if (response.err) console.error(query, response);

    const end = Date.now();
    const time = end - start;
    if (time > 2_000) console.warn("VQL time > 2s", time, "\n", query);
    middleTime.push(time);

    console.debug(query, response?.result || response, time);
    loaderView.off();
    return response;
}

export function logVQLTime() {
    const time =  middleTime.reduce((a, b) => a + b, 0) / middleTime.length;
    const seconds = Math.round(time / 100) / 10;
    console.log("VQL middle time " + Math.floor(time) + "ms", "s =", seconds + "s");
}
mgl.fetchVQL = fetchVQL;
mgl.logVQLTime = logVQLTime;

export async function fetchVideoInfo(id: string) {
    if (!id) return null;
    const response = await fetchVQL(`api video! s.url = ${id}`);
    return response.result as VideoInfo;
}

export async function updateVideoHistoryTime(id: string, time: number) {
    if (!id || isNaN(time)) return;
    await fetchVQL(`user ~history! s._id = ${id} u.time = ${time}`);
}

export async function markVideoAsWatched(id: string) {
    if (!id) return;
    await fetchVQL(`user updateOneOrAdd history s._id=${id} u.watched=true u.last=${Math.floor(Date.now() / 1000)}`);
}

export async function fetchVideoHistoryTime(id: string) {
    if (!id) return;
    const response = await fetchVQL(`user history! s._id = ${id}`);
    const res = response?.result;
    if (!res) return 0;
    return res.watched ? res.time : 0;
}

export async function removeVideoFromHistory(id: string) {
    if (!id) return;
    await fetchVQL(`user -history! s._id = ${id}`);
}

export async function fetchHistory() {
    const query = `
user history
many: true
relations:
  info:
    path: [api, video-static]
    select: [title,description]

search: {}
select:
  _id: 1
  time: 1
  watched: 1
  last: 1
  info:
    title: 1
    duration: 1
    uploadDate: 1
    views: 1
    thumbnail: 1
    `.trim();
    const response = await fetchVQL(query);
    return response.result as HistoryEntry[];
}

export async function fetchPlaylists(
    playlistsCb?: (playlists: PlaylistsEntry[]) => void,
    yieldCb?: (playlist: PlaylistsEntry) => void
): Promise<PlaylistsEntry[]> {
    const playlists = await fetchVQL(`user playlist`);
    if (playlistsCb) playlistsCb(playlists.result);

    const playlistEntries: PlaylistsEntry[] = [];

    await Promise.all(
        playlists.result.map(async (playlist: { _id: string, name: string, last: number }) => {
            const query = `
playlist ${playlist._id}
relations:
  info:
    path: [api, video-static]
    select: [thumbnail,duration]

many: true
search: {}
select: 
  _id: 1
  last: 1
  info:
    duration: 1
    thumbnail: 1
            `.trim();

            const videosRes = await fetchVQL(query);
            const entry: PlaylistsEntry = {
                ...playlist,
                videosCount: videosRes.result.length,
                thumbnail: videosRes.result[0]?.info?.thumbnail || "/favicon.svg",
                duration: videosRes.result.reduce((a, b) => a + b.info.duration, 0) || 0,
            };

            playlistEntries.push(entry);
            if (yieldCb) yieldCb(entry);
        })
    );

    return playlistEntries;
}

export async function fetchPlaylistInfo(id: string) {
    if (!id) return null;
    const query = `
playlist ${id}
relations:
  info:
    path: [api, video-static]
    select: [title,duration,thumbnail]

many: true
search: {}
select:
  _id: 1
  info:
    title: 1
    duration: 1
    thumbnail: 1
    `
    const response = await fetchVQL(query);
    return response.result as PlaylistEntry[];
}

export async function searchVideo(title: string, size: number) {
    const response = await fetchVQL(`api search! s.q = "${title.replace("\n", " ")}" s.size = ${size}`);
    return response.result;
}

export async function fetchPlaylistsAndVideoExists(videoId: string) {
    const playlists = await fetchPlaylists() as (PlaylistsEntry & { has: boolean })[];

    const containsPromise = playlists.map(async (playlist) => {
        const has = await fetchVQL(`playlist findOne ${playlist._id} s._id = ${videoId}`);
        playlist.has = !!has.result;
        return playlist;
    });

    const contains = await Promise.all(containsPromise);
    return contains;
}

export async function getPlaylistIds(playlistId: string) {
    const response = await fetchVQL(`api playlist s._id = ${playlistId}`);
    return response.result;
}