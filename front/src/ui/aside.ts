import { UiComponent } from "../types/ui";
import historyView from "./history";
import playListsView from "./playListsView";

class AsideView implements UiComponent {
    element: HTMLDivElement;

    mount(): void {
        this.element = document.querySelector<HTMLDivElement>("aside")!;

        this.element.querySelector<HTMLButtonElement>("#show-history-button").addEventListener("dblclick", () => {
            historyView.loadHistory();
        });

        this.element.querySelector<HTMLButtonElement>("#show-playlists-button").addEventListener("dblclick", () => {
            playListsView.loadPlaylists();
        });
    }
}

const asideView = new AsideView();
export default asideView;