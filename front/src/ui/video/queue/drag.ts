import { $store } from "#store";
import { QueuePanel } from ".";
import { emitQueueMessage } from "./sync";

let draggingId: string | null = null;

export function handleDragStart(cmp: QueuePanel, e: DragEvent) {
    const target = e.target as HTMLElement;
    const card = target.closest(".queueCard") as HTMLElement;
    if (!card) return;
    cmp.element.clA("dragging");

    draggingId = card.getAttribute("data-id");
    card.clA("dragging");
}

export function handleDragOver(cmp: QueuePanel, e: DragEvent) {
    e.preventDefault();
    const target = e.target as HTMLElement;
    const card = target.closest(".queueCard") as HTMLElement;
    if (!card || !draggingId) return;

    const draggedCard = cmp.element.qi(draggingId);
    if (draggedCard === card) return;

    const rect = card.getBoundingClientRect();
    const offset = rect.y + rect.height / 2;

    if (e.clientY < offset) {
        cmp.element.insertBefore(draggedCard, card);
    } else {
        cmp.element.insertBefore(draggedCard, card.nextSibling);
    }

    updateQueueOrder(cmp);
}

export function handleDrop(cmp: QueuePanel) {
    const card = cmp.element.querySelector(".dragging") as HTMLElement;
    if (card) {
        card.clR("dragging");
        const cardId = card.getAttribute("data-id");
        if (cardId === $store.videoId.get()) {
            const index = cmp.queue.indexOf(cardId);
            cmp.queueIndex = index;
        }
        emitQueueMessage("post", { q: cmp.queue });
    }
    draggingId = null;
    setTimeout(() => {
        cmp.element.clR("dragging");
    }, 20);
}

export function updateQueueOrder(cmp: QueuePanel) {
    const cards = cmp.element.querySelectorAll(".queueCard");
    cmp.queue = Array.from(cards).map(c => c.getAttribute("data-id")).filter(Boolean) as string[];
}