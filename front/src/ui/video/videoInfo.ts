import { $store } from "#store";
import { VideoInfo } from "#types/video";
import { UiComponent } from "@wxn0brp/flanker-ui";

class VideoInfoView implements UiComponent {
    element: HTMLElement;

    mount(): void {
        this.element = document.querySelector("#video-info");

        $store.video.subscribe(data => {
            data ? this.renderVideoInfo(data) : (this.element.innerHTML = "");
        });
    }

    renderVideoInfo(info: VideoInfo): void {
        const d = info.uploadDate;
        const date = d[6] + d[7] + "." + d[4] + d[5] + "." + d[0] + d[1] + d[2] + d[3];
        this.element.innerHTML = `
            <h3 title="${info.title}">${info.title}</h3>
            <b>Upload date:</b> ${date} -
            <b>Views:</b> ${info.views} -
            <b>Likes:</b> ${info.likes}
            <br><br>
            <p>${info.description.replace(/\n/g, "<br>") || "No description"}</p>
        `;
    }
}

const videoInfoView = new VideoInfoView();
export default videoInfoView;