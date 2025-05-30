import { PlaylistEntry, PlaylistsEntry } from "#types/video";
import { fetchVQL } from ".";

export async function fetchPlaylists(
    playlistsCb?: (playlists: PlaylistsEntry[]) => void,
    yieldCb?: (playlist: PlaylistsEntry) => void
): Promise<PlaylistsEntry[]> {
    const playlists = await fetchVQL(`user playlist`);
    if (playlistsCb) playlistsCb(playlists);

    const playlistEntries: PlaylistsEntry[] = [];

    await Promise.all(
        playlists.map(async (playlist: { _id: string, name: string, last: number }) => {
            const query = `
playlist ${playlist._id}
relations:
  info:
    path: [api, video-static]

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
                videosCount: videosRes.length,
                thumbnail: videosRes[0]?.info?.thumbnail || "/favicon.svg",
                duration: videosRes.reduce((a, b) => a + b.info.duration, 0) || 0,
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
    return await fetchVQL<PlaylistEntry[]>(query);
}

export async function fetchPlaylistsContainingVideo(videoId: string) {
    const playlists = await fetchPlaylists() as (PlaylistsEntry & { has: boolean })[];

    const containsPromise = playlists.map(async (playlist) => {
        const has = await fetchVQL(`playlist findOne ${playlist._id} s._id = ${videoId}`);
        playlist.has = !!has;
        return playlist;
    });

    const contains = await Promise.all(containsPromise);
    return contains;
}

export async function fetchPlaylistSnap(id: string) {
    const query = `
playlist ${id}
relations:
  info:
    path: [api, video-static]
    select: [title,duration,thumbnail,views]
  history:
    path: [user, history]
    select: [time]

many: true
search: {}
select:
  _id: 1
  info:
    title: 1
    duration: 1
    thumbnail: 1
    views: 1
  history:
    time: 1    
`
    const data = await fetchVQL(query);
    return data;
}