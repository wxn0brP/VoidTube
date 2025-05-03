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
#m
user history
many: true
relations:
  info:
    path: [api, video-static]
    select: [title,description]
   
search: {}
select: 
  - [_id]
  - [time]
  - [watched]
  - [last]
  - [info,title]
  - [info,duration]
  - [info,uploadDate]
  - [info,views]
  - [info,thumbnail]
    `.trim();
    const response = await fetchVQL(query);
    return response.result as HistoryEntry[];
}

export async function fetchPlaylists() {
    const playlists = await fetchVQL(`user playlist`);
    const playlistsData = [];
    playlists.result.forEach((playlist: { _id: string, name: string }) => {
        const query = `
#m
playlist ${playlist._id}
many: true
relations:
  info:
    path: [api, video-static]
    select: [thumbnail,duration]
   
search: {}
select: 
  - [_id]
  - [info,duration]
  - [info,thumbnail]
    `.trim();
        playlistsData.push(fetchVQL(query));
    });

    const videos = await Promise.all(playlistsData);
    const result = playlists.result.map((playlist: { _id: string, name: string }, index: number) => ({
        ...playlist,
        videosCount: videos[index].result.length,
        thumbnail: videos[index].result[0]?.["info.thumbnail"] || "/favicon.svg",
        duration: videos[index].result.reduce((a, b) => a + b["info.duration"], 0) || 0,
    }));
    return result;
}

export async function fetchPlaylistInfo(id: string) {
    if (!id) return null;
    const query = `
#m
playlist ${id}
many: true
relations:
  info:
    path: [api, video-static]
    select: [title,duration,thumbnail]
search: {}
select:
  - [_id]
  - [info,title]
  - [info,duration]
  - [info,thumbnail]
    `
    const response = await fetchVQL(query);
    return response.result as PlaylistEntry[];
}

export async function searchVideo(title: string, size: number) {
    const response = await fetchVQL(`
#m
api search!
search:
  q: ${title.replace("\n", " ")}
  size: ${size}
`);
    return response.result;
}