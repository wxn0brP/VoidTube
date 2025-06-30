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
    private draggingId: string | null = null;

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
            card.setAttribute("draggable", "true");
            card.setAttribute("data-id", item._id);
            if (item._id === $store.videoId.get()) card.clA("playing");
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

            card.addEventListener("dragstart", this.handleDragStart.bind(this));
            card.addEventListener("dragover", this.handleDragOver.bind(this));
            card.addEventListener("drop", this.handleDrop.bind(this));

            this.element.appendChild(card);
            this.cards.set(item._id, card);
        });

        setTimeout(() => {
            this.scrollToPlayCard();
        }, 50);
    }

    private handleDragStart(e: DragEvent) {
        const target = e.target as HTMLElement;
        const card = target.closest(".queueCard") as HTMLElement;
        if (!card) return;
        this.element.clA("dragging");

        this.draggingId = card.getAttribute("data-id");
        card.clA("dragging");
    }

    private handleDragOver(e: DragEvent) {
        e.preventDefault();
        const target = e.target as HTMLElement;
        const card = target.closest(".queueCard") as HTMLElement;
        if (!card || !this.draggingId) return;

        const draggedCard = this.element.qi(this.draggingId);
        if (draggedCard === card) return;

        const rect = card.getBoundingClientRect();
        const offset = rect.y + rect.height / 2;

        if (e.clientY < offset) {
            this.element.insertBefore(draggedCard, card);
        } else {
            this.element.insertBefore(draggedCard, card.nextSibling);
        }

        this.updateQueueOrder();
    }

    private handleDrop() {
        const card = this.element.querySelector(".dragging") as HTMLElement;
        if (card) {
            card.clR("dragging");
            const cardId = card.getAttribute("data-id");
            if (cardId === $store.videoId.get()) {
                const index = this.queue.indexOf(cardId);
                this.queueIndex = index;
            }
        }
        this.draggingId = null;
        setTimeout(() => {
            this.element.clR("dragging");
        }, 20);
    }

    private updateQueueOrder() {
        const cards = this.element.querySelectorAll(".queueCard");
        this.queue = Array.from(cards).map(c => c.getAttribute("data-id")).filter(Boolean) as string[];
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
        $store.videoId.subscribe((id) => {
            this.element.querySelectorAll<HTMLDivElement>(".playing").forEach(c => c.clR("playing"));
            this.element.qi(id)?.clA("playing");
        })
    }
}

const queuePanel = new QueuePanel();
export default queuePanel;