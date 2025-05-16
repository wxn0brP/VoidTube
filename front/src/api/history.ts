import { HistoryEntry } from "#types/video";
import { fetchVQL } from ".";

export async function updateVideoHistoryTime(id: string, time: number) {
    if (!id || isNaN(time)) return;
    await fetchVQL(`user ~history! s._id = ${id} u.time = ${time}`, true);
}

export async function fetchVideoHistoryTime(id: string): Promise<number> {
    if (!id) return;
    const res = await fetchVQL(`user history! s._id = ${id}`);
    if (!res) return 0;
    return res.watched ? res.time : 0;
}

export async function fetchHistory(limit = 0) {
    const query = `
user history
relations:
  info:
    path: [api, video-static]
    relations:
      channelData:
        path: [api, channelInfo]
        pk: channel
        fk: id

many: true
${limit ? `options: 
  max: ${limit}
  reverse: true
` : ""}
search:
  watched: true
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