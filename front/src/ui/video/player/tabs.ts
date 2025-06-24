import { $store } from "#store";
import playerView from ".";
import { changePlay } from "./status";

interface ChannelMessage {
    type: "play";
}

const channel = new BroadcastChannel("tabs");

channel.addEventListener("message", (event: MessageEvent<ChannelMessage>) => {
    if (event.data.type === "play") {
        if ($store.settings.onePlay.get() && !playerView.videoEl.paused) changePlay();
    }
});

export function emitPlay() {
    if (!$store.settings.onePlay.get()) return;
    channel.postMessage({
        type: "play",
        payload: {}
    });
}