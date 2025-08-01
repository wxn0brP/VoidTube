import { fetchHistory } from "#api/history";
import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { HistoryEntry } from "#types/video";
import { cardHelpers, filterCards } from "#ui/helpers/card";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, fewItems, formatTime, getThumbnail, numToLocale, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import uiFunc from "../modal";
import navBarView from "../navBar";
import { thumbnailMiddle } from "./channel";
import { VQLFind } from "@wxn0brp/vql-client/vql";

class HistoryView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    searchInput: HTMLInputElement;
    hasMore = true;
    page = 0;
    loading = false;
    threshold = 1000;

    render(history: HistoryEntry[]) {
        const elementsCount = Math.max(history.length, this.page * 32);
        fewItems(this.container, elementsCount);

        if (elementsCount === 0) {
            this.container.innerHTML = `<h1 style="text-align: center;" id="history-empty">No history</h1>`;
            this.searchInput.style.display = "none";
            return;
        } else {
            this.searchInput.style.display = "";
            this.container.querySelector("#history-empty")?.remove();
        }

        history
            .sort((a, b) => b.last - a.last)
            .forEach(entry => {
                const card = document.createElement("div");
                card.className = "historyCard";
                card.clA("card");
                card.dataset.id = entry._id;

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
                        <button button title="Queue" class="btn" data-id="queue">Queue➕</button>
                        <button button title="Remove" class="btn rm" data-id="rm">Remove</button>
                        <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `

                cardHelpers.click(card, entry);
                cardHelpers.author(card, entry.info.channel);
                cardHelpers.queue(card, entry);
                cardHelpers.playlist(card, entry);

                card.querySelector(`[data-id=rm]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();

                    const sure = await uiFunc.confirm("Are you sure? You can't undo this");
                    if (!sure) return;

                    fetchVQL(`user -history s._id = ${entry._id}`).then(() => {
                        this.container.removeChild(card);
                    });
                });

                this.container.appendChild(card);
            });
    }

    public async clearAndLoad(count = 0) {
        const cfg: VQLFind["options"] = {
            sortBy: "last",
            sortAsc: false,
        }
        if (count > 0) cfg.max = count;

        this.loading = true;
        const history = await fetchHistory(cfg);
        this.hasMore = count > 0;
        this.page = Math.ceil(history.length / 32);
        
        this.container.innerHTML = "";
        this.render(history);
        this.container.scrollTop = 0;
        this.loading = false;

        return history;
    }

    async loadPartialHistory() {
        if (!this.hasMore) return;
        if (this.loading) return;

        this.loading = true;
        const history = await fetchHistory({
            offset: this.page * 32,
            max: 32,
            sortBy: "last",
            sortAsc: false,
        });
        if (history.length === 0) {
            this.hasMore = false;
            return;
        }
        this.render(history);
        this.page++;
        this.loading = false;
    }

    async appendLastVideo(id: string) {
        let card = this.container.qi(id);
        if (!card) {
            const history = await fetchHistory(null, id);
            this.render(history);
            card = this.container.qi(id);
        }
        this.container.insertBefore(card, this.container.firstChild);
    }

    mount(): void {
        this.element = qs("#history-view");
        this.container = this.element.querySelector("#history-container")!;
        this.searchInput = qs("#history-search")!;
        this.searchInput.style.display = "none";

        uiHelpers.storeHide(this.element, $store.view.history);
        $store.view.history.set(false);

        // quick load
        setTimeout(() => {
            this.loadPartialHistory();
        }, 100);
        filterCards(this);

        this.container.addEventListener("scroll", () => {
            const { scrollTop, scrollHeight, clientHeight } = this.container;
            if (scrollHeight - scrollTop - clientHeight < this.threshold) {
                this.loadPartialHistory();
            }
        });
    }

    show() {
        changeView("history");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("history");
    }
}

const historyView = new HistoryView();
export default historyView;

mgl.historyShow = historyView.show;