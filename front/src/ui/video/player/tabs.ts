import { $store, appendLastVideos } from "#store";
import playerView from ".";
import { changePlay } from "./status";

type ChannelMessage = ChannelMessage_Signal | ChannelMessage_LastVideo;

interface ChannelMessage_Signal {
    type: "play" | "emitLastVideos";
}

interface ChannelMessage_LastVideo {
    type: "lastVideo";
    payload: {
        id: string | string[];
    }
}

const channel = new BroadcastChannel("tabs");

channel.addEventListener("message", (event: MessageEvent<ChannelMessage>) => {
    console.log("[Tabs]", event.data);
    const type = event.data.type;
    if (type === "play") {
        if ($store.settings.onePlay.get() && !playerView.videoEl.paused) changePlay();
    } else if (type === "lastVideo") {
        appendLastVideos(event.data.payload.id);
    } else if (type === "emitLastVideos") {
        emitLastVideo($store.lastVideos.get());
    }
});

export function emitPlay() {
    if (!$store.settings.onePlay.get()) return;
    channel.postMessage({ type: "play", payload: {} });
}

export function emitLastVideo(id: string | string[] = $store.videoId.get()) {
    if (!$store.settings.antiRecommendationLoop.get()) return;
    channel.postMessage({ type: "lastVideo", payload: { id } });
}

$store.videoId.subscribe(emitLastVideo);
setTimeout(() => {
    if (!$store.settings.antiRecommendationLoop.get()) return;
    channel.postMessage({ type: "emitLastVideos", payload: {} });
}, 200);