import { $store } from "../../store";
import { UiComponent } from "../../types/ui";

class VideoView implements UiComponent {
    element: HTMLElement;

    mount(): void {
        this.element = document.querySelector("#video-view");

        $store.view.video.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.video.set(false);
    }
}

export const videoView = new VideoView();
export default videoView;