import { fetchPlaylistsAndVideoExists, fetchVQL } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import uiFunc from "./modal";
import playListsView from "./playLists";

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
        const mappedPlaylists = playlists.map((playlist) => {
            return playlist.name + " (" + (playlist.has ? "Remove" : "Add") + ")";
        });
        const mappedPlaylistsIds = playlists.map((playlist) => playlist._id);
        mappedPlaylists.push("Cancel");
        mappedPlaylistsIds.push("");
        mappedPlaylists.push("Create new playlist");
        const newPlaylistId = "VLL_" + Math.random().toString(36).substring(2, 9);
        mappedPlaylistsIds.push(newPlaylistId);

        const select = await uiFunc.selectPrompt(
            "Add/Remove to playlist",
            mappedPlaylists,
            mappedPlaylistsIds
        );

        if (select === "") return;
        if (select === newPlaylistId) {
            const name = await uiFunc.prompt("Playlist name");
            if (!name) return;
            fetchVQL(`user +playlist s.name = ${name}`).then(() => {
                this.toggleToPlayList();
            });
            return;
        }

        const playlistIndex = playlists.findIndex((playlist) => playlist._id === select);
        if (playlistIndex === -1) return;
        const playlist = playlists[playlistIndex];
        const op = playlist.has ? "removeOne" : "add";
        await fetchVQL(`playlist ${op} ${select} ${playlist.has ? "s" : "d"}._id = ${id}`);
        await playListsView.loadPlaylists();
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