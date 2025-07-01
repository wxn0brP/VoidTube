import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { ChannelInfo } from "#types/channel";
import channelView, { thumbnailMiddle } from "#ui/view/channel";
import { number2HumanFormatter } from "#utils";
import { loadMediaSession } from "./status";

export function setupChannelInfo() {
    const playerInfoDiv = document.querySelector("#video-channel-info");
    const img = playerInfoDiv.querySelector("img");
    const name = playerInfoDiv.querySelector("#video-channel-name");
    const subs = playerInfoDiv.querySelector("#video-channel-subscriptions");
    const subscribeBtn = playerInfoDiv.querySelector("#video-channel-subscribe");

    $store.video.subscribe(async video => {
        const channelData = await fetchVQL<ChannelInfo>("api channelInfo! s._id = " + video.channel);
        $store.videoChannelName.set(channelData.name);
        img.src = thumbnailMiddle + channelData.avatar;
        name.innerHTML = channelData.name;
        subs.innerHTML = number2HumanFormatter.format(channelData.subscribers) + " subscribers";
        loadMediaSession();
    });

    $store.video.subscribe(async ({ channel }) => {
        const res = await fetchVQL("user subs! s._id = " + channel);
        subscribeBtn.innerHTML = !!res ? "Subscribed" : "Subscribe";
        subscribeBtn.classList.toggle("subscribed", !!res);
    });

    playerInfoDiv.addEventListener("click", () => {
        channelView.load($store.video.get().channel);
    });

    playerInfoDiv.addEventListener("contextmenu", (e) => {
        e.preventDefault();
        window.open(window.location.origin + "/?channel=" + $store.video.get().channel, "_blank");
    });

    subscribeBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        e.stopPropagation();
        const id = $store.video.get().channel;
        const res = await fetchVQL("user subs! s._id = " + id);
        const q = !!res ? 
            "user -subs! s._id = " + id :
            "user updateOneOrAdd subs s._id = " + id + " u.time=" + Math.floor(Date.now() / 1000);

        await fetchVQL(q);
        subscribeBtn.innerHTML = !!res ? "Subscribe" : "Subscribed";
        subscribeBtn.classList.toggle("subscribed", !(!!res));
    });
}