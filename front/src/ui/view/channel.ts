import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { ChannelInfo, ChannelVideo } from "#types/channel";
import { cardHelpers } from "#ui/helpers/card";
import { uiMsg } from "#ui/modal/message";
import { clearQueryParams, formatTime, numToLocale, setTitle, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";
import "./channel.scss";

export const thumbnailMiddle = "/avatar?link=";

export const followsFormatter = new Intl.NumberFormat(undefined, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
});

class ChannelView implements UiComponent {
    element: HTMLDivElement;
    info: HTMLDivElement;
    name: HTMLHeadingElement;
    subscriptions: HTMLParagraphElement;
    videos: HTMLDivElement;
    avatar: HTMLImageElement;
    banner: HTMLImageElement;
    loadVideosButton: HTMLButtonElement;
    channelSubscribeBtn: HTMLButtonElement;
    channelShareBtn: HTMLButtonElement;

    render(data: ChannelInfo) {
        this.name.innerHTML = data.name;
        this.subscriptions.innerHTML = `${followsFormatter.format(data.subscribers || 0)} subscribers`;
        this.info.innerHTML = `<p>${data.description.replace(/\n/g, "<br>")}</p>`;
        this.videos.innerHTML = "";

        this.avatar.src = data.avatar ? thumbnailMiddle + data.avatar : "/favicon.svg";
        this.banner.src = data.banner ? thumbnailMiddle + data.banner : "/favicon.svg";
        this.banner.style.display = data.banner ? "" : "none";
        fetchVQL(`user subs! s._id = ${data.id}`).then(res => {
            this.channelSubscribeBtn.innerHTML = !!res ? "Subscribed" : "Subscribe";
            this.channelSubscribeBtn.classList.toggle("subscribed", !!res);
        });
    }

    mount(): void {
        this.element = document.querySelector("#channel-view");
        this.info = this.element.querySelector("#channel-info");
        this.name = this.element.querySelector("#channel-name");
        this.subscriptions = this.element.querySelector("#channel-subscriptions");
        this.videos = this.element.querySelector("#channel-videos");
        this.avatar = this.element.querySelector("#channel-avatar");
        this.banner = this.element.querySelector("#channel-banner");
        this.loadVideosButton = this.element.querySelector("#load-channel-videos")!;
        this.channelSubscribeBtn = this.element.querySelector("#channel-subscribe")!;
        this.channelShareBtn = this.element.querySelector("#channel-share")!;

        uiHelpers.storeHide(this.element, $store.view.channel);
        $store.view.channel.set(false);

        this.channelSubscribeBtn.addEventListener("click", async () => {
            const id = $store.channelId.get();
            const res = await fetchVQL("user subs! s._id = " + id);
            const q = !!res ?
                "user -subs! s._id = " + id :
                "user updateOneOrAdd subs s._id = " + id + " u.last=" + Math.floor(Date.now() / 1000);

            await fetchVQL(q);
            this.channelSubscribeBtn.innerHTML = !!res ? "Subscribe" : "Subscribed";
            this.channelSubscribeBtn.classList.toggle("subscribed", !(!!res));
        });

        this.channelShareBtn.addEventListener("click", () => {
            navigator.clipboard.writeText("https://youtube.com/channel/" + $store.channelId.get());
            uiMsg("Link copied to clipboard");
        });
    }

    show() {
        changeView("channel");
        setTitle("");
        clearQueryParams();
        updateQueryParam("channel", $store.channelId.get());
        navBarView.save("channel");
    }

    async load(id: string) {
        $store.channelId.set(id);
        const data = await fetchVQL<ChannelInfo>("api channelInfo! s._id = " + id + " s.update = true");
        this.render(data);
        setTimeout(() => this.loadVideos(id), 100);
        this.loadVideosButton.addEventListener("click", () => this.loadVideos(id, false));
        this.show();
    }

    async loadVideos(id: string, flat = true) {
        const data = await fetchVQL<ChannelVideo[]>(`
api channelVideos
search:
  _id: ${id}
  flat: ${flat}
many: true
relations:
  history:
    path: [user, history]
    pk: id
    select: [time]
`);
        this.videos.innerHTML = "";
        for (const entry of data) {
            const card = document.createElement("div");
            card.className = "channelVideoCard";
            card.clA("card");

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3 title="${entry.title}">${entry.title}</h3>
                ${formatTime(entry?.history?.time, null)} / ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views
                <div class="btns">
                    <button class="btn" data-id="queue">Queue➕</button>
                    <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            cardHelpers.click(card, entry);
            cardHelpers.queue(card, entry);
            cardHelpers.playlist(card, entry);

            this.videos.appendChild(card);
        }
    }
}

const channelView = new ChannelView();
export default channelView;