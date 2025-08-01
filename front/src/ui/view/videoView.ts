import { $store } from "#store";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";

class VideoView implements UiComponent {
    element: HTMLElement;

    mount(): void {
        this.element = qs("#video-view");
        uiHelpers.storeHide(this.element, $store.view.video);
        $store.view.video.set(false);
    }
}

export const videoView = new VideoView();
export default videoView;