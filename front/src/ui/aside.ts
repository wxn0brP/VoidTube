import { UiComponent } from "@wxn0brp/flanker-ui";
import historyView from "./view/history";
import playListsView from "./view/playListsView";

class AsideView implements UiComponent {
    element: HTMLDivElement;

    mount(): void {
        this.element = qs("aside");

        const showHistoryBtn = this.element.querySelector<HTMLButtonElement>("#show-history-button");
        showHistoryBtn.addEventListener("dblclick", () => {
            historyView.clearAndLoad(32);
        });
        showHistoryBtn.addEventListener("mousedown", (e: MouseEvent) => {
            if (e.button === 1) {
                e.preventDefault();
                historyView.clearAndLoad(0);
            }
        });

        this.element.querySelector<HTMLButtonElement>("#show-playlists-button").addEventListener("dblclick", () => {
            playListsView.loadPlaylists();
        });
    }
}

const asideView = new AsideView();
export default asideView;