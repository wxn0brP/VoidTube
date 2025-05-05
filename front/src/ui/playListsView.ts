import { changeView } from ".";
import { fetchPlaylists, fetchVQL, getPlaylistIds } from "../apiFront";
import { mgl } from "../mgl";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { PlaylistsEntry } from "../types/video";
import { formatTime, updateQueryParam } from "../utils";
import uiFunc from "./modal";
import playListsModal from "./modal/playlists";
import playListView from "./playList";

class PlayListsView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    createPlaylistBtn: HTMLButtonElement;
    importPlaylistBtn: HTMLButtonElement;

    render(playlist: PlaylistsEntry[]) {
        this.container.innerHTML = "";
        playlist.forEach((item) => {
            const card = document.createElement("div");
            card.className = "playlistCard";
            card.innerHTML = `
                <div style="background-image: url(${item.thumbnail})" class="img"></div>
                <h3>${item.name}</h3>
                ${item.videosCount} videos <br>
                Duration: ${formatTime(item.duration, null)}
                <div class="btns">
                    <button class="btn rm" data-id="rm">Delete</button>
                    <button class="btn" data-id="rename">Rename</button>
                </div>
            `;

            card.addEventListener("click", () => {
                playListView.loadPlaylist(item._id);
                playListView.show();
            });

            card.querySelector(`[data-id=rm]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();

                const sure = await uiFunc.confirm("Are you sure? You can't undo this");
                if (!sure) return;
                const sure2 = await uiFunc.confirm("Are you really sure? You can't undo this");
                if (!sure2) return;

                fetchVQL(`user -playlist s._id = ${item._id}`).then(() => {
                    this.loadPlaylists();
                    fetchVQL(`playlist removeCollection ${item._id}`);
                });
            });

            card.querySelector(`[data-id=rename]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                const name = await uiFunc.prompt("Playlist name", item.name);
                if (!name) return;
                fetchVQL(`user updateOne playlist s._id = ${item._id} u.name = ${name}`).then(() => {
                    this.loadPlaylists();
                });
            });

            this.container.appendChild(card);
        });
    }

    async loadPlaylists() {
        const playlist = await fetchPlaylists();
        this.render(playlist);
        return playlist;
    }

    mount(): void {
        this.element = document.querySelector("#playlists-view");
        this.container = this.element.querySelector("#playlists-container")!;
        this.createPlaylistBtn = this.element.querySelector("#create-playlist")!;
        this.importPlaylistBtn = this.element.querySelector("#import-playlist")!;

        this.createPlaylistBtn.onclick = async () => {
            const name = await uiFunc.prompt("Playlist name");
            if (!name) return;
            fetchVQL(`user +playlist d.name = ${name}`).then(() => {
                this.loadPlaylists();
            });
        };

        this.importPlaylistBtn.onclick = async () => {
            const from = await uiFunc.selectPrompt(
                "Import playlist from",
                ["YouTube", "URLs/IDs", "FreeTube", "Cancel"]
            );
            if (!from || from === "Cancel") return;

            let ids = [];

            if (from === "YouTube") {
                const playlistUrl = await uiFunc.prompt("Playlist URL");
                if (!playlistUrl) return;
                ids = await getPlaylistIds(playlistUrl);
            } else if (from === "URLs/IDs") {
                const playlistUrls = await uiFunc.prompt("Playlist URLs/IDs");
                if (!playlistUrls) return;
                ids = playlistUrls.split("\n").map(url => {
                    return url
                        .trim()
                        .replace("https://www.youtube.com/watch?v=", "")
                        .replace("https://youtu.be/", "");
                });
            } else if (from === "FreeTube") {
                ids = await new Promise<string[]>(r => {
                    const fileA = document.createElement("input");
                    fileA.type = "file";
                    fileA.accept = ".json,.db";
                    fileA.click();
                    fileA.onchange = () => {
                        const file = fileA.files![0];
                        const reader = new FileReader();
                        reader.onload = () => {
                            const data = JSON.parse(reader.result as string);
                            r(data.videos.map(v => v.videoId) as string[]);
                        };
                        reader.readAsText(file);
                    };
                });
            }

            const playlist = await new Promise(r => {
                playListsModal.show({ callback: r });
            });
            if (!playlist) return;

            for (let i = 0; i < ids.length; i++) {
                await fetchVQL(`playlist +${playlist} d._id = ${ids[i]}`);
            }
            this.loadPlaylists();
        };

        $store.view.playlists.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.playlists.set(false);
        this.loadPlaylists();
    }

    show() {
        changeView("playlists");
        updateQueryParam("v", undefined);
        updateQueryParam("query", undefined);
    }
}

const playListsView = new PlayListsView();
export default playListsView;

mgl.playlistsShow = playListsView.show;