import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import uiFunc from "#ui/modal";
import { QueuePanel } from ".";
import { render } from "./render";

export async function clear(cmp: QueuePanel, confirm = false) {
    if (confirm && !await uiFunc.confirm("Are you sure you want to clear the queue?")) return;
    cmp.queue = [];
    cmp.videoMap.clear();
    cmp.queueIndex = 0;
    if ($store.videoId.get()) append(cmp, $store.videoId.get());
    else render(cmp);
}

export function append(cmp: QueuePanel, ids: string | string[]) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    cmp.queue = [...cmp.queue, ...idsArray];
    render(cmp);
}

export function appendToNext(cmp: QueuePanel, id: string) {
    cmp.queue.splice(cmp.queueIndex + 1, 0, id);
    render(cmp);
}

export function remove(cmp: QueuePanel, id: string | number) {
    const index = typeof id === "number" ? id : cmp.queue.indexOf(id);
    cmp.queue.splice(index, 1);
    if (index >= cmp.queueIndex) cmp.queueIndex = cmp.queue.length - 1;
    render(cmp);
}

export async function loadPlaylist(cmp: QueuePanel, id: string) {
    const playlist = await fetchPlaylistInfo(id);
    append(cmp, playlist.map(item => item._id));
}