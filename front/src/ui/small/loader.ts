import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";

class LoaderView implements UiComponent {
    element: HTMLDivElement;
    valueSpan: HTMLSpanElement;

    mount(): void {
        this.element = document.querySelector("#loader")!;
        this.valueSpan = document.querySelector("#loader-value")!;

        $store.loader.subscribe((open) => {
            this.element.style.opacity = open > 0 ? "1" : "0";
            this.valueSpan.textContent = open.toString();
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