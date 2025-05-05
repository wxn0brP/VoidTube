import { fetchPlaylistsAndVideoExists, fetchVQL } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import playListsModal from "./modal/playlists";
import playListsView from "./playListsView";

class MetaControlView implements UiComponent {
    element: HTMLDivElement;
    toggleToPlayListBtn: HTMLButtonElement;
    removeFromPlayListBtn: HTMLButtonElement;
    shareBtn: HTMLButtonElement;
    downloadBtn: HTMLButtonElement;

    mount(): void {
        this.element = document.querySelector("#meta-control-bar")!;

        this.toggleToPlayListBtn = this.element.querySelector("#toggle-to-playlist")!;
        this.shareBtn = this.element.querySelector("#share")!;
        this.downloadBtn = this.element.querySelector("#download")!;

        this.toggleToPlayListBtn.onclick = () => this.toggleToPlayList();
        this.shareBtn.onclick = () => this.share();
        this.downloadBtn.onclick = this.download.bind(this);
    }

    public async toggleToPlayList(id = $store.videoId.get()) {
        const playlists = await fetchPlaylistsAndVideoExists(id);

        playListsModal.show({
            callback: async (playlistId) => {
                if (!playlistId) return;

                const playlistIndex = playlists.findIndex((playlist) => playlist._id === playlistId);
                if (playlistIndex === -1) return;
                const playlist = playlists[playlistIndex];
                const op = playlist.has ? "removeOne" : "add";

                await fetchVQL(`playlist ${op} ${playlistId} ${playlist.has ? "s" : "d"}._id = ${id}`);
                await fetchVQL(`user ~playlist s._id=${playlistId} u.last=${Math.floor(Date.now() / 1000)}`)
                await playListsView.loadPlaylists();
            },
            reRenderCallback: () => {
                playListsModal.elements.forEach((item) => {
                    const has = playlists.find((playlist) => playlist._id === item.id)?.has ?? false;
                    item.ele.classList.toggle("hasVideo", has);
                    item.ele.style.setProperty("--title", `"Existing (remove)"`);
                });
            },
            playlists
        });
    }

    public share(id = $store.videoId.get()) {
        navigator.clipboard.writeText("https://youtube.com/watch?v=" + id);
        alert("Link copied to clipboard");
    }

    public download() {
    }
}

const metaControlView = new MetaControlView();
export default metaControlView;