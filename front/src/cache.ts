import { updateVideoHistoryTime } from "#api/history";
import { $store } from "#store";
import queuePanel from "#ui/video/queue";
import { joinGroup, queuesMesh } from "#ui/video/queue/sync";
import { delay } from "@wxn0brp/flanker-ui/utils";

function lastProgres() {
    const lastProgress = localStorage.getItem("cache.progress");
    if (!lastProgress) return;

    const payload = JSON.parse(lastProgress);
    const { id, time } = payload;

    updateVideoHistoryTime(id, time).then(() => {
        localStorage.removeItem("cache.progress");
    });
}

async function lastQueue() {
    const lastQueueName = localStorage.getItem("cache.queueName");
    const lastQueue = localStorage.getItem("cache.queue");
    localStorage.removeItem("cache.queueName");
    localStorage.removeItem("cache.queue");
    
    if (lastQueueName) {
        joinGroup(lastQueueName);
        await delay(1000);
        if (queuesMesh.has(lastQueueName)) return;
    }

    console.log("[Queue]", "No last queue. Using default queue.");
    
    if (!lastQueue) return;

    const payload = JSON.parse(lastQueue);
    queuePanel.append(payload.q);
    $store.queueIndex.set(payload.i);
}

lastProgres();
lastQueue();

export { }