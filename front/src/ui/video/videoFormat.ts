import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { Format } from "#types/video";

export class VideoFormatsView implements UiComponent {
    element: HTMLSelectElement;

    mount(): void {
        this.element = qs("#video-formats")!;

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

            if (videoFormats.length === 0) return;
            
            const prefered = $store.settings.quality.get();
            const url = getPreferredVideoUrl(videoFormats, prefered);
            this.element.value = url;
            $store.selectedVideoUrl.set(url);
        });

        this.element.addEventListener("change", () => {
            $store.selectedVideoUrl.set(this.element.value);
        });
    }
}
function getPreferredVideoUrl(videoFormats: Format[], preferred: string) {
    const parseResolution = (res: string) => {
        const match = res.match(/(\d+)x(\d+)/);
        return match ? parseInt(match[2], 10) : 0;
    };

    const grouped = videoFormats.reduce((acc, format) => {
        const height = parseResolution(format.resolution);
        if (!acc[height]) acc[height] = [];
        acc[height].push(format);
        return acc;
    }, {});

    const available = Object.keys(grouped).map(Number).sort((a, b) => a - b);

    if (preferred === "best") {
        const highest = available[available.length - 1];
        return grouped[highest][0].url;
    }

    const preferredHeight = parseInt(preferred, 10);
    if (isNaN(preferredHeight)) return null;

    if (grouped[preferredHeight]) {
        return grouped[preferredHeight][0].url;
    }

    for (let i = available.length - 1; i >= 0; i--) {
        if (available[i] < preferredHeight) {
            return grouped[available[i]][0].url;
        }
    }

    for (let i = 0; i < available.length; i++) {
        if (available[i] > preferredHeight) {
            return grouped[available[i]][0].url;
        }
    }

    return null;
}

const videoFormatsView = new VideoFormatsView();
export default videoFormatsView;