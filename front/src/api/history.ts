import { HistoryEntry } from "#types/video";
import { fetchVQL } from ".";

export async function updateVideoHistoryTime(id: string, time: number) {
    if (!id || isNaN(time)) return;
    await fetchVQL(`user ~history! s._id = ${id} u.time = ${time}`, { silent: true });
}

export async function fetchVideoHistoryTime(id: string): Promise<number> {
    if (!id) return;
    const res = await fetchVQL(`user history! s._id = ${id}`);
    if (!res) return 0;
    return res.watched ? res.time : 0;
}

export async function fetchHistory($in?: string[]) {
    const query = `
user history
relations:
  info:
    path: [api, video-static-quick]
    relations:
      channelData:
        path: [api, channelInfo]
        pk: channel
        fk: id
        type: "11"

many: true
search:
  watched: true
  ${$in ? `$in: { _id: [${$in.map(id => `"${id}"`).join(",")}] }` : ""}
select:
  _id: 1
  time: 1
  last: 1
  info:
    title: 1
    duration: 1
    uploadDate: 1
    views: 1
    thumbnail: 1
    channel: 1
    channelData:
      name: 1
      avatar: 1
    `.trim();
    return await fetchVQL<HistoryEntry[]>(query);
}