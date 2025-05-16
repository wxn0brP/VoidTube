import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { ChannelInfo } from "#types/channel";
import channelView, { followsFormatter, thumbnailMiddle } from "#ui/channel";
import { loadMediaSession } from "./status";

export function setupChannelInfo() {
    const playerInfoDiv = document.querySelector("#video-channel-info");
    const img = playerInfoDiv.querySelector("img");
    const name = playerInfoDiv.querySelector("#video-channel-name");
    const subs = playerInfoDiv.querySelector("#video-channel-subscriptions");

    $store.video.subscribe(async video => {
        const channelData = await fetchVQL<ChannelInfo>("api channelInfo! s._id = " + video.channel);
        $store.videoChannelName.set(channelData.name);
        img.src = thumbnailMiddle + channelData.avatar;
        name.innerHTML = channelData.name;
        subs.innerHTML = followsFormatter.format(channelData.subscribers) + " subscribers";
        loadMediaSession();
    });

    playerInfoDiv.addEventListener("click", () => {
        channelView.load($store.video.get().channel);
    });

    playerInfoDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.open(window.location.origin + "/?channel=" + $store.video.get().channel, "_blank");
    });
}