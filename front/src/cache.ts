import { updateVideoHistoryTime } from "#api/history";

function lastProgres () {
    const lastProgress = localStorage.getItem("cache.progress");
    if (!lastProgress) return;

    const payload = JSON.parse(lastProgress);
    const { id, time } = payload;

    updateVideoHistoryTime(id, time).then(() => {
        localStorage.removeItem("cache.progress");
    });
}

lastProgres();

export {}