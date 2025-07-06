import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import { UiComponent } from "@wxn0brp/flanker-ui";
import "./queue.scss";
import { scrollToPlayCard } from "./utils";
import { append, appendToNext, clear, loadPlaylist } from "./queue";

type Shift<T extends any[]> = T extends [any, ...infer U] ? U : never;

export class QueuePanel implements UiComponent {
    element: HTMLDivElement;

    queue: string[] = [];
    videoMap = new Map<string, VideoQuickInfo>();
    cards = new Map<string, HTMLDivElement>();

    public queryParams() {
        // const playlistId = $store.playlistId.get();
        // const playlistIndex = $store.playlistIndex.get();
        // if (playlistId) updateQueryParam("p", playlistId);
        // if (playlistIndex) updateQueryParam("pi", playlistIndex.toString());
    }

    append = (...args: Shift<Parameters<typeof append>>) => append(this, ...args);
    appendToNext = (...args: Shift<Parameters<typeof appendToNext>>) => appendToNext(this, ...args);
    clear = (...args: Shift<Parameters<typeof clear>>) => clear(this, ...args);
    loadPlaylist = (...args: Shift<Parameters<typeof loadPlaylist>>) => loadPlaylist(this, ...args);

    mount(): void {
        this.element = document.querySelector("#queue-panel");

        this.element.addEventListener("mouseenter", () => scrollToPlayCard(this));
        this.element.addEventListener("mouseleave", () => scrollToPlayCard(this));
        $store.videoId.subscribe(() => scrollToPlayCard(this));
        $store.queueIndex.subscribe((index) => {
            this.element.querySelectorAll<HTMLDivElement>(".playing").forEach(c => c.clR("playing"));
            this.element.qs("[data-index='" + index + "']")?.clA("playing");
        });
    }
}

const queuePanel = new QueuePanel();
export default queuePanel;