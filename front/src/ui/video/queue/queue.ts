import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import uiFunc from "#ui/modal";
import { QueuePanel } from ".";
import { render } from "./render";
import { emitQueueMessage } from "./sync";

export async function clear(cmp: QueuePanel, confirm = false, silent = false) {
    if (confirm && !await uiFunc.confirm("Are you sure you want to clear the queue?")) return;
    cmp.queue = [];
    cmp.videoMap.clear();
    cmp.queueIndex = 0;
    if (!silent) emitQueueMessage("clear");
    if ($store.videoId.get()) append(cmp, $store.videoId.get());
    else render(cmp);
}

export function append(cmp: QueuePanel, ids: string | string[], silent = false) {
    const idsArray = Array.isArray(ids) ? ids : [ids];
    cmp.queue = [...cmp.queue, ...idsArray];
    render(cmp);
    if (!silent) emitQueueMessage("add", { id: idsArray });
}

export function appendToNext(cmp: QueuePanel, id: string, silent = false) {
    cmp.queue.splice(cmp.queueIndex + 1, 0, id);
    render(cmp);
    if (!silent) emitQueueMessage("addNext", { id });
}

export function remove(cmp: QueuePanel, id: string | number, silent = false) {
    const index = typeof id === "number" ? id : cmp.queue.indexOf(id);
    cmp.queue.splice(index, 1);
    if (index >= cmp.queueIndex) cmp.queueIndex = cmp.queue.length - 1;
    render(cmp);
    if (!silent) emitQueueMessage("remove", { id });
}

export async function loadPlaylist(cmp: QueuePanel, id: string, silent = false) {
    const playlist = await fetchPlaylistInfo(id);
    append(cmp, playlist.map(item => item._id), silent);
}