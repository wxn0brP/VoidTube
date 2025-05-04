import { changeView } from ".";
import { fetchHistory } from "../apiFront";
import { $store } from "../store";
import { UiComponent } from "../types/ui";
import { HistoryEntry } from "../types/video";
import { formatTime, updateQueryParam } from "../utils";
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
                    <div style="background-image: url(${entry.info.thumbnail})"></div>
                    <h3>${entry.info.title}</h3>
                    ${formatTime(entry.time, null)} / ${formatTime(entry.info.duration, null)} <br>
                    ${entry.info.views.toLocaleString()} views -
                    ${date}
                `

                card.addEventListener("click", () => {
                    loadVideo(entry._id, !playerView.paused);
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