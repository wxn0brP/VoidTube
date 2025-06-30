import { fetchPlaylistInfo } from "#api/playlist";
import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import { loadVideo } from "#ui/video/player/status";
import { formatTime, getThumbnail } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { fetchVQL } from "@wxn0brp/vql-client";
import "./queue.scss";

class QueuePanel implements UiComponent {
    element: HTMLDivElement;

    queue: string[] = [];
    videoMap = new Map<string, VideoQuickInfo>();
    queueIndex = 0;
    cards = new Map<string, HTMLDivElement>();

    async render() {
        if (!this.queue) {
            this.element.style.display = "none";
            return;
        }

        const videos = new Map<string, VideoQuickInfo>();
        const missing = [];

        this.queue.forEach(id => {
            this.videoMap.has(id) ?
                videos.set(id, this.videoMap.get(id)) :
                missing.push(id);
        });

        if (missing.length) {
            const info = await fetchVQL({
                query: "api video-static-quick s.$in._id = $_id",
                var: {
                    _id: missing
                }
            });
            for (const item of info) {
                this.videoMap.set(item._id, item);
                videos.set(item._id, item);
            }
        }

        const rendered = this.queue.map(id => videos.get(id));
        this.element.innerHTML = "";
        this.element.style.display = "";
        this.cards.clear();
        rendered.forEach((item) => {
            const card = document.createElement("div");
            card.className = "queueCard";
            card.innerHTML = `
                <div class="img">
                    <img src="${getThumbnail(item.thumbnail, item._id)}"></div>
                </div>
                <div class="info">
                    <div class="title" title="${item.title}">${item.title}</div>
                    <div class="meta">
                        <div class="channel">${item.channelName}</div>
                        <div class="duration">${formatTime(item.duration, null)}</div>
                    </div>
                </div>
            `;
            card.addEventListener("click", () => {
                loadVideo(item._id);
            });
            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + item._id);
            });
            this.element.appendChild(card);
            this.cards.set(item._id, card);
        });

        setTimeout(() => {
            this.scrollToPlayCard();
        }, 50);
    }

    public async loadPlaylist(id: string) {
        const playlist = await fetchPlaylistInfo(id);
        this.append(playlist.map(item => item._id));
    }

    public queryParams() {
        // const playlistId = $store.playlistId.get();
        // const playlistIndex = $store.playlistIndex.get();
        // if (playlistId) updateQueryParam("p", playlistId);
        // if (playlistIndex) updateQueryParam("pi", playlistIndex.toString());
    }

    public clear() {
        this.queue = [];
        this.videoMap.clear();
        this.render();
    }

    public append(ids: string | string[]) {
        const idsArray = Array.isArray(ids) ? ids : [ids];
        this.queue = [...this.queue, ...idsArray];
        this.render();
    }

    scrollToPlayCard() {
        const id = $store.videoId.get();
        if (!this.cards.has(id)) return;
        const card = this.cards.get(id);
        card.scrollIntoView({ behavior: "smooth", block: "center" });
    }

    mount(): void {
        this.element = document.querySelector("#queue-panel");

        this.element.addEventListener("mouseenter", () => this.scrollToPlayCard());
        this.element.addEventListener("mouseleave", () => this.scrollToPlayCard());
        $store.videoId.subscribe(() => this.scrollToPlayCard());
    }
}

const queuePanel = new QueuePanel();
export default queuePanel;