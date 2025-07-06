import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import uiFunc from "#ui/modal";
import { getThumbnail, formatTime } from "#utils";
import { fetchVQL } from "@wxn0brp/vql-client";
import { loadVideo } from "../player/status";
import { QueuePanel } from ".";
import { remove } from "./queue";
import { handleDragOver, handleDragStart, handleDrop } from "./drag";
import { scrollToPlayCard } from "./utils";

export async function render(cmp: QueuePanel) {
    if (!cmp.queue) {
        cmp.element.style.display = "none";
        return;
    }

    const videos = new Map<string, VideoQuickInfo>();
    const missing = [];

    cmp.queue.forEach(id => {
        cmp.videoMap.has(id) ?
            videos.set(id, cmp.videoMap.get(id)) :
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
            cmp.videoMap.set(item._id, item);
            videos.set(item._id, item);
        }
    }

    const rendered = cmp.queue.map(id => videos.get(id));
    cmp.element.innerHTML = "";
    cmp.element.style.display = "";
    cmp.cards.clear();
    rendered.forEach((item, i) => {
        const card = document.createElement("div");
        card.className = "queueCard";
        card.setAttribute("draggable", "true");
        card.setAttribute("data-id", item._id);
        card.setAttribute("data-index", i.toString());
        if (cmp.queueIndex === i) card.clA("playing");
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

        card.addEventListener("click", async (e: MouseEvent) => {
            if (!e.shiftKey) {
                cmp.queueIndex = +card.getAttribute("data-index");
                return loadVideo(item._id);
            }
            e.preventDefault();
            cmp.element.clA("dragging");
            let confirm = e.altKey || await uiFunc.confirm("Are you sure you want to remove cmp video from the queue?");
            if (!confirm) return;
            remove(cmp, i);
            setTimeout(() => cmp.element.clR("dragging"), 10);
        });

        card.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            window.open(window.location.origin + "/?v=" + item._id);
        });

        card.addEventListener("dragstart", (e) => handleDragStart(cmp, e));
        card.addEventListener("dragover", (e) => handleDragOver(cmp, e));
        card.addEventListener("drop", () => handleDrop(cmp));

        cmp.element.appendChild(card);
        cmp.cards.set(item._id, card);
    });

    setTimeout(() => {
        scrollToPlayCard(cmp);
    }, 50);
}