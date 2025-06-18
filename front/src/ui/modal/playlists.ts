import { fetchVQL } from "#api/index";
import { fetchPlaylists } from "#api/playlist";
import { $store } from "#store";
import { PlaylistsEntry } from "#types/video";
import playListsView from "#ui/view/playListsView";
import { formatTime } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import uiFunc from ".";

class PlayListsModal implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    callback: (id: string) => void;
    createPlaylistBtn: HTMLButtonElement;
    elements: { ele: HTMLDivElement; id: string }[] = [];
    reRenderCallback: () => void;

    render(playlist: PlaylistsEntry[]) {
        this.container.innerHTML = "";
        this.elements = [];
        playlist.sort((a, b) => b.last - a.last).forEach((item) => {
            const card = document.createElement("div");
            card.className = "playlistCard";
            card.innerHTML = `
                <div style="background-image: url(${item.thumbnail})" class="img"></div>
                <h3 title="${item.name}">${item.name}</h3>
                ${item.videosCount} videos <br>
                Duration: ${formatTime(item.duration, null)}
            `;

            card.addEventListener("click", () => {
                this.callback(item._id);
                this.hide();
                $store.playlistsCache.set([]);
            });

            this.container.appendChild(card);
            this.elements.push({ ele: card, id: item._id });
        });
    }

    mount(): void {
        this.element = document.querySelector("#playlists-modal")!;
        this.container = this.element.querySelector("#playlists-modal-container")!;
        this.createPlaylistBtn = this.element.querySelector("[data-id=create]")!;
        this.element.querySelector<HTMLButtonElement>("[data-id=cancel]")!.onclick = () => {
            this.callback(null);
            this.hide();
        }

        this.createPlaylistBtn.onclick = async () => {
            const name = await uiFunc.prompt("Playlist name");
            if (!name) return;
            fetchVQL(`user +playlist d.name = ${name} d.last = ${Math.floor(Date.now() / 1000)}`).then(async () => {
                const playlists = await playListsView.loadPlaylists();
                this.render(playlists);
                this.reRenderCallback?.();
            });
        };
    }

    public async show(
        cfg: {
            callback: (id: string) => void
            reRenderCallback?: () => void
            playlists?: PlaylistsEntry[]
        }
    ) {
        this.callback = cfg.callback;
        if (cfg.reRenderCallback) this.reRenderCallback = cfg.reRenderCallback;

        const playlists = cfg.playlists || $store.playlistsCache.get() || await fetchPlaylists();
        this.render(playlists);
        this.reRenderCallback?.();
        $store.playlistsCache.set(playlists);

        this.element.fadeIn();
    }

    hide() {
        this.callback = () => { };
        this.reRenderCallback = () => { };
        this.element.fadeOut();
    }
}

const playListsModal = new PlayListsModal();
export default playListsModal;