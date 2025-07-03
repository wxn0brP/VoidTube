import { $store } from "#store";
import { QueuePanel } from ".";

export function scrollToPlayCard(cmp: QueuePanel) {
    const id = $store.videoId.get();
    if (!cmp.cards.has(id)) return;
    const card = cmp.cards.get(id);
    card.scrollIntoView({ behavior: "smooth", block: "center" });
}