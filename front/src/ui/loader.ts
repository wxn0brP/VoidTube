import { $store } from "../store";
import { UiComponent } from "../types/ui";

class LoaderView implements UiComponent {
    element: HTMLDivElement;

    mount(): void {
        this.element = document.querySelector("#loader")!;

        $store.loader.subscribe((open) => {
            this.element.style.opacity = open > 0 ? "1" : "0";
        });
    }

    on() {
        $store.loader.value++;
        $store.loader.notify();
    }

    off() {
        $store.loader.value--;
        $store.loader.notify();
    }

}

const loaderView = new LoaderView();
export default loaderView;