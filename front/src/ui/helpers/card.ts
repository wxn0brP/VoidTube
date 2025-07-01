import metaControlView from "#ui/video/metaControl";
import { loadVideo } from "#ui/video/player/status";
import queuePanel from "#ui/video/queue";
import channelView from "#ui/view/channel";
import { clearQueryParams } from "#utils";
import { delay } from "@wxn0brp/flanker-ui/utils";

export const cardHelpers = {
    click(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.addEventListener("mousedown", async (e: MouseEvent) => {
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
                    localStorage.setItem("cache.queue", JSON.stringify({
                        i: queuePanel.queueIndex,
                        q: queuePanel.queue
                    }));
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