import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { ChannelInfo } from "#types/channel";
import { UiComponent } from "#types/ui";
import { formatTime, numToLocale, setTitle, updateQueryParam } from "#utils";
import { changeView } from ".";
import metaControlView from "./metaControl";
import navBarView from "./navBar";
import playerView from "./player";
import { loadVideo } from "./player/status";

const thumbnailMiddle = "/avatar?link="

class ChannelView implements UiComponent {
    element: HTMLDivElement;
    info: HTMLDivElement;
    name: HTMLHeadingElement;
    subscriptions: HTMLParagraphElement;
    videos: HTMLDivElement;
    avatar: HTMLImageElement;
    banner: HTMLImageElement;
    loadVideosButton: HTMLButtonElement;

    render(data: ChannelInfo) {
        const avatar = data.thumbnails.find(t => t.id == "avatar_uncropped");
        const banner = data.thumbnails.find(t => t.id == "banner_uncropped");

        this.name.innerHTML = data.name;
        this.subscriptions.innerHTML = `${data.subscribers} subscribers`;
        this.info.innerHTML = `<p>${data.description}</p>`;
        this.videos.innerHTML = "";

        this.avatar.src = avatar ? thumbnailMiddle + avatar.url : "/favicon.svg";
        this.banner.src = banner ? thumbnailMiddle + banner.url : "/favicon.svg";
        this.banner.style.display = banner ? "" : "none";
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

        $store.view.channel.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.channel.set(false);
    }

    show() {
        changeView("channel");
        setTitle("");
        updateQueryParam("v", undefined);
        navBarView.save("channel");
    }

    async load(id: string) {
        const data = await fetchVQL<ChannelInfo>("api channelInfo! s._id = " + id);
        this.render(data);
        this.loadVideosButton.onclick = () => this.loadVideos(id);
        this.show();
    }

    async loadVideos(id: string) {
        const data = await fetchVQL(`
api channelVideos
search:
  _id: ${id}
many: true
relations:
  history:
    path: [user, history]
    pk: id
    select: [time,_id]
`);
        this.videos.innerHTML = "";
        for (const entry of data) {
            const card = document.createElement("div");
            card.className = "channelVideoCard";

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3>${entry.title}</h3>
                ${formatTime(entry?.history?.time, null)} / ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views
                <div class="btns">
                    <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            card.addEventListener("click", () => {
                $store.playlistId.set("");
                $store.playlist.set([]);
                $store.playlistIndex.set(0);
                updateQueryParam("p", undefined);
                updateQueryParam("pi", undefined);
                loadVideo(entry._id, true);
            });

            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + entry._id);
            });

            card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(entry._id);
            });

            this.videos.appendChild(card);
        }
    }
}

const channelView = new ChannelView();
export default channelView;