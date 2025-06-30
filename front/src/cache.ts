import { updateVideoHistoryTime } from "#api/history";
import queuePanel from "#ui/video/queue";

function lastProgres() {
    const lastProgress = localStorage.getItem("cache.progress");
    if (!lastProgress) return;

    const payload = JSON.parse(lastProgress);
    const { id, time } = payload;

    updateVideoHistoryTime(id, time).then(() => {
        localStorage.removeItem("cache.progress");
    });
}

function lastQueue() {
    const lastQueue = localStorage.getItem("cache.queue");
    if (!lastQueue) return;

    const payload = JSON.parse(lastQueue);
    queuePanel.append(payload.q);
    queuePanel.queueIndex = payload.i;
    localStorage.removeItem("cache.queue");
}

lastProgres();
lastQueue();

export { }