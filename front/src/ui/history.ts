import { changeView } from ".";
import { fetchHistory, fetchVQL } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { HistoryEntry } from "../types/video";
import { formatTime, updateQueryParam } from "../utils";
import metaControlView from "./metaControl";
import uiFunc from "./modal";
import playerView from "./player";
import { loadVideo } from "./player/status";

class HistoryView implements UiComponent {
    element: HTMLElement;

    render(history: HistoryEntry[]) {
        this.element.innerHTML = "";

        history
            .filter(entry => entry.watched)
            .sort((a, b) => b.last - a.last)
            .forEach(entry => {
                const card = document.createElement("div");
                card.className = "historyCard";

                const dateRaw = entry.info.uploadDate;
                const date = dateRaw[6] + dateRaw[7] + "." + dateRaw[4] + dateRaw[5] + "." + dateRaw[0] + dateRaw[1] + dateRaw[2] + dateRaw[3];

                card.innerHTML = `
                    <div style="background-image: url(${entry.info.thumbnail})" class="img"></div>
                    <h3>${entry.info.title}</h3>
                    ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                    ${entry.info.views.toLocaleString()} views -
                    ${date}
                    <div class="btns">
                        <button button title="Remove" class="btn rm" data-id="rm">Remove</button>
                        <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `

                card.addEventListener("click", () => {
                    loadVideo(entry._id, !playerView.paused);
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

                this.element.appendChild(card);
            });
    }

    public async loadHistory() {
        const history = await fetchHistory();
        this.render(history);
    }

    mount(): void {
        this.element = document.querySelector("#history-view");

        $store.view.history.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.history.set(false);

        this.loadHistory();
    }

    show() {
        changeView("history");
        updateQueryParam("v", undefined);
    }
}

const historyView = new HistoryView();
export default historyView;

(window as any).historyShow = historyView.show;