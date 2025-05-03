import { $store } from "../store";
import { UiComponent } from "../types/ui";

class LoaderView implements UiComponent {
    element: HTMLDivElement;

    mount(): void {
        this.element = document.querySelector("#loader")!;

        $store.loader.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });
    }
}

const loaderView = new LoaderView();
export default loaderView;