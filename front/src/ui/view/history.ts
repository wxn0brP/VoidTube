import { fetchHistory } from "#api/history";
import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { HistoryEntry } from "#types/video";
import { loadVideo } from "#ui/video/player/status";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, fewItems, formatTime, getThumbnail, levenshtein, numToLocale, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import uiFunc from "../modal";
import navBarView from "../navBar";
import metaControlView from "../video/metaControl";
import channelView, { thumbnailMiddle } from "./channel";

class HistoryView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    searchInput: HTMLInputElement;

    render(history: HistoryEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, history.length);

        if (!history.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No history</h1>`;
            this.searchInput.style.display = "none";
            return;
        } else {
            this.searchInput.style.display = "";
        }

        history
            .sort((a, b) => b.last - a.last)
            .forEach(entry => {
                const card = document.createElement("div");
                card.className = "historyCard";
                card.clA("card");

                const dateRaw = entry.info.uploadDate;
                const date = dateRaw[6] + dateRaw[7] + "." + dateRaw[4] + dateRaw[5] + "." + dateRaw[0] + dateRaw[1] + dateRaw[2] + dateRaw[3];

                card.innerHTML = `
                    <div style="background-image: url(${getThumbnail(entry.info.thumbnail, entry._id)})" class="img"></div>
                    <h3 title="${entry.info.title}">${entry.info.title}</h3>
                    ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                    ${numToLocale(entry.info.views)} views -
                    ${date}
                    <div class="author">
                        <img src="${thumbnailMiddle + entry.info.channelData.avatar}" class="avatar">
                        <a href="/?channel=${entry.info.channel}">${entry.info.channelData.name}</a>
                    </div>
                    <div class="btns">
                        <button button title="Remove" class="btn rm" data-id="rm">Remove</button>
                        <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `

                card.addEventListener("click", () => {
                    $store.playlistId.set("");
                    $store.playlist.set([]);
                    $store.playlistIndex.set(0);
                    clearQueryParams();
                    loadVideo(entry._id);
                });

                card.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    window.open(window.location.origin + "/?v=" + entry._id);
                });

                card.querySelector(`.author`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    channelView.load(entry.info.channel);
                });

                card.querySelector(`[data-id=rm]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const sure = await uiFunc.confirm("Are you sure? You can't undo this");
                    if (!sure) return;

                    fetchVQL(`user -history s._id = ${entry._id}`).then(() => {
                        this.loadHistory();
                    });
                });

                card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    metaControlView.toggleToPlayList(entry._id);
                });

                this.container.appendChild(card);
            });
    }

    public async loadHistory() {
        const history = await fetchHistory();
        this.render(history);
        return history;
    }

    async loadPartialHistory() {
        const idsData = await fetchVQL<{ _id: string, last: number }[]>(`user history`);
        const ids = idsData.sort((a, b) => b.last - a.last).map(d => d._id).slice(0, 32);
        const history = await fetchHistory(ids);
        this.render(history);
    }

    mount(): void {
        this.element = document.querySelector("#history-view");
        this.container = this.element.querySelector("#history-container")!;
        this.searchInput = document.querySelector("#history-search")!;
        this.searchInput.style.display = "none";

        uiHelpers.storeHide(this.element, $store.view.history);
        $store.view.history.set(false);

        // quick load
        setTimeout(() => {
            this.loadPartialHistory();
        }, 100);
        // load all history
        setTimeout(() => {
            this.loadHistory();
        }, window.location.search.length > 0 ? 7_000 : 2_000);

        this.searchInput.oninput = () => {
            const query = this.searchInput.value;
            this.filterSeeAll();
            if (!query) return;
            this.filter(query);
        }
    }

    show() {
        changeView("history");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("history");
    }

    filterSeeAll() {
        const cards = this.container.querySelectorAll<HTMLDivElement>(".historyCard");
        cards.forEach(card => {
            card.style.display = "";
        });
    }

    filter(query: string) {
        const normalizedQuery = query.trim().toLowerCase();

        const cards = this.container.querySelectorAll<HTMLDivElement>(".historyCard");

        cards.forEach(card => {
            const title = card.querySelector("h3")!.textContent!.toLowerCase();

            const dist = levenshtein(normalizedQuery, title);
            const maxAllowed = Math.floor(title.length * 0.4);

            card.style.display = dist <= maxAllowed || title.includes(normalizedQuery) ? "" : "none";
        });
    }

}

const historyView = new HistoryView();
export default historyView;

mgl.historyShow = historyView.show;