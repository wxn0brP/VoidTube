import { $store } from "#store";
import metaControlView from "#ui/video/metaControl";
import { loadVideo } from "#ui/video/player/status";
import queuePanel from "#ui/video/queue";
import channelView from "#ui/view/channel";
import { clearQueryParams, levenshtein } from "#utils";
import { delay } from "@wxn0brp/flanker-ui/utils";

export const cardHelpers = {
    click(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.addEventListener("mousedown", async (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            // if button/link is clicked, do nothing
            if (target.closest("button, .btn, a")) return;

            // TODO -
            // $store.playlistId.set("");
            // $store.playlist.set([]);
            // $store.playlistIndex.set(0);
            e.preventDefault();
            e.stopPropagation();

            if (e.button === 0) {
                clearQueryParams();
                loadVideo(data.id || data._id);
            } else {
                await delay(50); // UX
                if (e.shiftKey || e.metaKey || e.ctrlKey || e.altKey) {
                    localStorage.setItem("cache.queueName", $store.queueGroup.get());
                }

                window.open(`/?v=${data.id || data._id}`, "_blank");
            }
        });
    },

    queue(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.querySelector(`[data-id=queue]`)!.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            const id = data.id || data._id;
            e.shiftKey ? queuePanel.appendToNext(id) : queuePanel.append(id);
        });
    },

    playlist(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.querySelector(`[data-id=playlist]`)!.addEventListener("click", (e: MouseEvent) => {
            e.stopPropagation();
            e.preventDefault();
            metaControlView.toggleToPlayList(data.id || data._id, e);
        });
    },

    author(card: HTMLElement, authorId: string) {
        card.querySelector(`.author`)!.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            channelView.load(authorId);
        });
    },

    avatarTry(card: HTMLElement) {
        card.querySelector(`img`).addEventListener("error", () => {
            card.querySelector(`img`).style.display = "none";
        });
    }
}

export interface filterSettings {
    container: HTMLDivElement,
    searchInput: HTMLInputElement,
    selector?: string,
    match?: number
}

function filterSeeAll({ container, selector }: filterSettings) {
    const cards = container.querySelectorAll<HTMLDivElement>(selector);
    cards.forEach(card => card.style.display = "");
}

function filter({ container, selector, match }: filterSettings, query: string) {
    const normalizedQuery = query.trim().toLowerCase();

    const cards = container.querySelectorAll<HTMLDivElement>(selector);

    cards.forEach(card => {
        const title = card.querySelector("h3")!.textContent!.toLowerCase();

        const dist = levenshtein(normalizedQuery, title);
        const maxAllowed = Math.floor(title.length * match);

        card.style.display = dist <= maxAllowed || title.includes(normalizedQuery) ? "" : "none";
    });
}

export function filterCards(settings: filterSettings) {
    settings = {
        match: 0.4,
        selector: ".card",
        ...settings
    };

    settings.searchInput.oninput = () => {
        const query = settings.searchInput.value;
        filterSeeAll(settings);
        if (!query) return;
        filter(settings, query);
    }
}