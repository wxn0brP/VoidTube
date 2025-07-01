import { fetchVQL } from "#api/index";
import { fetchPlaylists } from "#api/playlist";
import { mgl } from "#mgl";
import { $store } from "#store";
import { PlaylistsEntry } from "#types/video";
import uiFunc from "#ui/modal";
import playListsModal from "#ui/modal/playlists";
import navBarView from "#ui/navBar";
import queuePanel from "#ui/video/queue";
import { fewItems, getThumbnail, setTitle, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import playListSnapView from "./playListSnap";

class PlayListsView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    createPlaylistBtn: HTMLButtonElement;
    importPlaylistBtn: HTMLButtonElement;

    render(playlist: PlaylistsEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, playlist.length);

        if (!playlist.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Playlists</h1>`;
            return;
        }
        playlist.sort((a, b) => b.last - a.last).forEach((item) => {
            const card = document.createElement("div");
            card.className = "playlistCard";
            card.clA("card");
            card.id = "playlist-" + item._id;
            this.renderCard(card, item);

            this.container.appendChild(card);
        });
        this.container.classList.toggle("fewItems", playlist.length <= 3);
    }

    renderCard(card: HTMLDivElement, item: PlaylistsEntry) {
        card.innerHTML = `
            <div style="background-image: url(${item?.thumbnail ? getThumbnail(item.thumbnail, item._id) : "/favicon.svg"})" class="img"></div>
            <h3 title="${item?.name}">${item?.name}</h3>
            ${item?.videosCount} videos <br>
            <div class="btns">
                <button class="btn rm" data-id="rm">Delete</button>
                <button class="btn" data-id="rename">Rename</button>
                <button class="btn" data-id="play">Play</button>
                <button class="btn" data-id="export">Export</button>
            </div>
        `;

        card.addEventListener("click", () => {
            playListSnapView.loadPlaylist(item._id);
            playListSnapView.show();
        });

        card.querySelector(`[data-id=play]`)!.addEventListener("click", (e) => {
            e.stopPropagation();
            e.preventDefault();
            queuePanel.loadPlaylist(item._id);
        });

        card.querySelector(`[data-id=rm]`)!.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();

            const sure = await uiFunc.confirm("Are you sure? You can't undo this");
            if (!sure) return;
            const sure2 = await uiFunc.confirm("Are you really sure? You can't undo this");
            if (!sure2) return;

            await fetchVQL(`user -playlist s._id = ${item._id}`)
            this.loadPlaylists();
            fetchVQL(`playlist removeCollection ${item._id}`);
        });

        card.querySelector(`[data-id=rename]`)!.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            const name = await uiFunc.prompt("Playlist name", item.name);
            if (!name) return;
            await fetchVQL(`user updateOne playlist s._id = ${item._id} u.name = ${name} u.last = ${Math.floor(Date.now() / 1000)}`);
            await this.loadPlaylists();
        });

        card.querySelector(`[data-id=export]`)!.addEventListener("click", async (e) => {
            e.stopPropagation();
            e.preventDefault();
            fetchVQL(`playlist ${item._id}`).then((res: { _id: string }[]) => {
                const ids = res.map(i => i._id);
                const link = document.createElement("a");
                link.href = `data:text/json;charset=utf-8,${encodeURIComponent(JSON.stringify(ids))}`;
                link.download = `${item.name}.json`;
                link.click();
            });
        });
    }

    async loadPlaylists() {
        const playlists = await fetchPlaylists(
            (play) => this.render(play),
            (item) => this.renderCard(this.container.querySelector(`#playlist-${item._id}`)!, item)
        );
        this.render(playlists);
        $store.playlistsCache.set(playlists);
        return playlists;
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
            const from = await uiFunc.selectPrompt({
                text: "Import playlist from",
                options: ["YouTube", "URLs/IDs", "VoidTube", "FreeTube", "Cancel"],
                defaultValue: "YouTube",
                cancelValue: "Cancel"
            });
            if (!from || from === "Cancel") return;

            let ids = [];

            if (from === "YouTube") {
                let playlistUrl = await uiFunc.prompt("Playlist URL");
                if (!playlistUrl) return;

                if (!playlistUrl.startsWith("https://www.youtube.com/playlist?list=")) {
                    playlistUrl = `https://www.youtube.com/playlist?list=${playlistUrl}`;
                }

                const url = new URL(playlistUrl);
                const listId = url.searchParams.get("list");

                ids = await fetchVQL<string[]>(`api playlistIds s._id = ${listId}`);
            } else if (from === "URLs/IDs") {
                const playlistUrls = await uiFunc.prompt("Playlist URLs/IDs");
                if (!playlistUrls) return;
                ids = playlistUrls.split("\n").map(url => {
                    return url
                        .trim()
                        .replace("https://www.youtube.com/watch?v=", "")
                        .replace("https://youtu.be/", "");
                });
            } else if (from === "VoidTube") {
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
                            r(data as string[]);
                        };
                        reader.readAsText(file);
                    };
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
            await fetchVQL(`user ~playlist s._id=${playlist} u.last=${Math.floor(Date.now() / 1000)}`);
            this.loadPlaylists();
        };

        uiHelpers.storeHide(this.element, $store.view.playlists);
        $store.view.playlists.set(false);

        setTimeout(() => {
            this.loadPlaylists();
        }, window.location.search.length > 0 ? 8_000 : 2_000);
    }

    show() {
        changeView("playlists");
        setTitle("");
        updateQueryParam("v", undefined);
        updateQueryParam("query", undefined);
        navBarView.save("playlists");
    }
}

const playListsView = new PlayListsView();
export default playListsView;

mgl.playlistsShow = playListsView.show;