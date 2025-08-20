import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { watchSelect } from "@wxn0brp/flanker-ui/component/helpers";

export class AudioFormatsView implements UiComponent {
    element: HTMLSelectElement;

    mount(): void {
        this.element = qs("#audio-formats")!;

        $store.video.subscribe(video => {
            if (!video) return;

            const audioFormats = video.formats.filter(f => f.is_audio && !f.is_video);

            this.element.innerHTML = "";

            audioFormats.forEach(format => {
                const option = document.createElement("option");
                option.value = format.url;
                option.textContent = `${format.ext.toUpperCase()} - ${format.fileSize ? (format.fileSize / (1024 * 1024)).toFixed(1) + " MB" : "Unknown size"}`;
                this.element.appendChild(option);
            });

            if (audioFormats.length > 0) {
                const last = audioFormats.length - 1;
                this.element.value = audioFormats[last].url;
                $store.selectedAudioUrl.set(audioFormats[last].url);
            }
        });

        watchSelect(this.element, $store.selectedAudioUrl);
    }
}

const audioFormatsView = new AudioFormatsView();
export default audioFormatsView;