import metaControlView from "#ui/video/metaControl";
import { loadVideo } from "#ui/video/player/status";
import queuePanel from "#ui/video/queue";
import channelView from "#ui/view/channel";
import { clearQueryParams } from "#utils";

export const cardHelpers = {
    click(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.addEventListener("click", () => {
            // TODO -
            // $store.playlistId.set("");
            // $store.playlist.set([]);
            // $store.playlistIndex.set(0);
            clearQueryParams();
            loadVideo(data.id || data._id);
        });
    },

    rightClick(card: HTMLElement, data: { id?: string, _id?: string }) {
        card.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            clearQueryParams();
            loadVideo(data.id || data._id);
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