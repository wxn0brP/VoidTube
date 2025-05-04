import { HistoryEntry, PlaylistEntry, PlaylistsEntry, VideoInfo } from "./types/video";

const middleTime: number[] = [];

async function fetchVQL(query: string | object) {
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
    if (end - start > 2_000) console.warn("VQL time > 2s", end - start, "\n", query);
    middleTime.push(end - start);

    console.debug(query, response?.result || response);
    return response;
}

(window as any).fetchVQL = fetchVQL;
export function logVQLTime() {
    const time =  middleTime.reduce((a, b) => a + b, 0) / middleTime.length;
    const seconds = Math.round(time / 100) / 10;
    console.log("VQL middle time " + Math.floor(time) + "ms", "s =", seconds + "s");
}
(window as any).logVQLTime = logVQLTime;

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

export async function fetchPlaylists() {
    const playlists = await fetchVQL(`user playlist`);
    const playlistsData = [];
    playlists.result.forEach((playlist: { _id: string, name: string }) => {
        const query = `
playlist ${playlist._id}
many: true
relations:
  info:
    path: [api, video-static]
    select: [thumbnail,duration]

search: {}
select: 
  _id: 1
  info:
    duration: 1
    thumbnail: 1
    `.trim();
        playlistsData.push(fetchVQL(query));
    });

    const videos = await Promise.all(playlistsData);
    const result = playlists.result.map((playlist: { _id: string, name: string }, index: number) => ({
        ...playlist,
        videosCount: videos[index].result.length,
        thumbnail: videos[index].result[0]?.info?.thumbnail || "/favicon.svg",
        duration: videos[index].result.reduce((a, b) => a + b.info.duration, 0) || 0,
    }));
    return result as PlaylistsEntry[];
}

export async function fetchPlaylistInfo(id: string) {
    if (!id) return null;
    const query = `
playlist ${id}
many: true
relations:
  info:
    path: [api, video-static]
    select: [title,duration,thumbnail]
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