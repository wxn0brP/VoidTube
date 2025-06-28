import { PlaylistEntry, PlaylistsEntry } from "#types/video";
import { getThumbnail } from "#utils";
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
            const videosRes = await fetchVQL(`playlist ${playlist._id}`);
            const firstVideo = await fetchVQL(`api video-static-quick! s._id = ${videosRes[0]._id}`);
            const thumbnail = firstVideo ? getThumbnail(firstVideo.thumbnail, firstVideo._id) : "/favicon.svg";

            const entry: PlaylistsEntry = {
                ...playlist,
                videosCount: videosRes.length,
                thumbnail,
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
    path: [api, video-static-quick]
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
    path: [api, video-static-quick]
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