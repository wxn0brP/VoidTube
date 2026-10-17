import { $store } from "#store";
import { Chapter, VideoInfo } from "#types/video";
import { formatTime } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import "./video.scss";
import { setDescription } from "./description";
import playerView from "./player";

class VideoInfoView implements UiComponent {
	element: HTMLElement;
	chapters: Chapter[] = [];

	mount() {
		this.element = qs("#video-info");

		$store.video.subscribe(data => {
			data ? this.renderVideoInfo(data) : (this.element.innerHTML = "");
		});

		playerView.mediaSync.eventEmitter.on("timeupdate", () =>
			this.highlightChapter(),
		);
	}

	renderVideoInfo(info: VideoInfo) {
		const d = info.uploadDate;
		const date =
			d[6] + d[7] + "." + d[4] + d[5] + "." + d[0] + d[1] + d[2] + d[3];
		this.element.innerHTML = `
            <h3 title="${info.title}">${info.title}</h3>
            <b>Upload date:</b> ${date} -
            <b>Views:</b> ${info.views} -
            <b>Likes:</b> ${info.likes}
            <br><br>
            <article data-id="description"></article>
            <div data-id="chapters"></div>
        `;
		setDescription(this.element.qs("description", 1), info.description);
		this.renderChapters(info.chapters || []);
	}

	renderChapters(chapters: Chapter[]) {
		this.chapters = chapters;
		const container = this.element.qs("chapters", 1);
		if (!container || !chapters.length) return;
		container.clA("chapters");

		const heading = document.createElement("h4");
		heading.textContent = "Chapters";
		container.appendChild(heading);

		chapters.forEach((chapter, index) => {
			const button = document.createElement("button");
			button.className = "chapter-btn";
			button.dataset.index = index.toString();
			button.textContent = `${formatTime(chapter.start_time, null)}  ${chapter.title}`;
			button.addEventListener("click", () =>
				playerView.mediaSync.seek(chapter.start_time),
			);
			container.appendChild(button);
		});
	}

	highlightChapter() {
		if (!this.chapters.length) return;
		const container = this.element.qs("chapters", 1);
		if (!container) return;

		const time = playerView.mediaSync.currentTime;
		let active = 0;
		for (let i = 0; i < this.chapters.length; i++) {
			if (time >= this.chapters[i].start_time) active = i;
			else break;
		}

		container.querySelectorAll(".chapter-btn").forEach((button, i) => {
			button.classList.toggle("active", i === active);
		});
	}
}

const videoInfoView = new VideoInfoView();
export default videoInfoView;
