import { $store } from "../store";
import { UiComponent } from "../types/ui";

export class VideoFormatsView implements UiComponent {
    element: HTMLSelectElement;

    mount(): void {
        this.element = document.querySelector("#video-formats")!;

        $store.video.subscribe(video => {
            if (!video) return;

            const videoFormats = video.formats.filter(f => f.is_video);

            this.element.innerHTML = "";

            videoFormats.forEach(format => {
                const option = document.createElement("option");
                option.value = format.url;
                option.textContent = `${format.resolution} (${format.ext})`;
                this.element.appendChild(option);
            });

            if (videoFormats.length > 0) {
                const last = videoFormats.length - 1;
                this.element.value = videoFormats[last].url;
                $store.selectedVideoUrl.set(videoFormats[last].url);
            }
        });

        this.element.addEventListener("change", () => {
            $store.selectedVideoUrl.set(this.element.value);
        });
    }
}

const videoFormatsView = new VideoFormatsView();
export default videoFormatsView;