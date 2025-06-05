import { UiComponent } from "@wxn0brp/flanker-ui";
import historyView from "./view/history";
import playListsView from "./view/playListsView";

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