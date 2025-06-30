import { fetchVQL } from "#api/index";
import { fetchPlaylistsContainingVideo } from "#api/playlist";
import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";
import playListsView from "#ui/view/playListsView";
import uiFunc from "../modal";
import playListsModal from "../modal/playlists";
import { uiMsg } from "#ui/modal/message";
import "./metaControl.scss";
import queuePanel from "./queue";

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
        this.element.querySelector<HTMLButtonElement>("#clear-queue")!.onclick = () => queuePanel.clear(true);

        this.toggleToPlayListBtn.onclick = (e) => this.toggleToPlayList($store.videoId.get(), e);
        this.shareBtn.onclick = () => this.share();
        this.downloadBtn.onclick = () => this.download();
    }

    public async toggleToPlayList(id = $store.videoId.get(), e?: Event) {
        if (e && e instanceof MouseEvent && e.shiftKey) {
            fetchVQL(`playlist updateOneOrAdd later s._id = ${id} u._id = ${id}`);
            fetchVQL(`user updateOneOrAdd playlist s._id=later u.last=${Math.floor(Date.now() / 1000)} add_arg.name = "Watch later"`);
            uiMsg("Added to watch later playlist");
            return;
        }

        const playlists = await fetchPlaylistsContainingVideo(id);

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
        uiMsg("Link copied to clipboard");
    }

    public async download() {
        const formats = $store.video.get().formats;
        const options = formats.map(f => {
        return `
            ${f.ext.toUpperCase()} -
            ${f.is_video ? "Video" : ""}
            ${f.is_audio && f.is_video ? "+" : ""}
            ${f.is_audio ? "Audio" : ""}
            ${f.fileSize ? (f.fileSize / (1024 * 1024)).toFixed(1) + " MB" : ""}
            ${f.fps ? " - " + f.fps + " FPS" : ""}
            ${f.resolution ? " - " + f.resolution : ""}
            `;
        });
        options.push("Download as mp3");
        options.push("Download as mp4");
        options.push("Cancel");

        const urls = formats.map(f => f.url);
        urls.push("mp3");
        urls.push("mp4");
        urls.push("");

        const url = await uiFunc.selectPrompt<string>("Select format", options, urls);
        if (!url || url === "Cancel") return;

        if (url === "mp3" || url === "mp4") {
            fetchVQL(`api +download d._id = ${$store.videoId.get()} d.format = ${url}`).then(res => {
                uiMsg("Downloaded to " + res.path);
            });
            return;
        }

        window.open(url, "_blank");
    }
}

const metaControlView = new MetaControlView();
export default metaControlView;