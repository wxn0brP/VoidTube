import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import { loadVideo } from "#ui/video/player/status";
import { getThumbnail, formatTime } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import metaControlView from "./metaControl";
import queuePanel from "./queue";
import { cardHelpers } from "#ui/helpers/card";

class RecommendationPanel implements UiComponent {
    element: HTMLDivElement;

    render(videos: string[]) {
        this.element.innerHTML = "";

        if ($store.lastVideos.get().length) {
            const lastVideos = new Set($store.lastVideos.get());
            const notIn = videos.filter(x => !lastVideos.has(x));
            const inLast = videos.filter(x => lastVideos.has(x));

            videos = [...notIn, ...inLast];
        }
        $store.recommendedId.set(videos[0]);

        videos.forEach(async (_id, i) => {
            const card = document.createElement("div");
            card.className = "videoCard card";

            function html(item: VideoQuickInfo) {
                if (!item) {
                    item = { title: "Error loading video" } as any;
                    setTimeout(() => {
                        card.remove();
                    }, 5000);
                }

                card.innerHTML = `
                    <div class="img" style="background-image: url(${getThumbnail(item.thumbnail, item._id)})"></div>
                    <h3 title="${item.title}">${item.title || "Loading..."}</h3>
                    <h4>${formatTime(item.duration, null)}</h4>
                    <div class="author">
                        <img src="${"/avatarTry?id=" + item.channel}" class="avatar">
                        <a href="/?channel=${item.channel}">${item.channelName || ""}</a>
                    </div>
                    <div class="btns">
                        <button class="btn" data-id="queue">Queue➕</button>
                        <button class="btn" data-id="playlist">Playlist 📂</button>
                    </div>
                `;

                cardHelpers.playlist(card, { _id });
                cardHelpers.queue(card, { _id });
                cardHelpers.author(card, item.channel);
                cardHelpers.avatarTry(card);
            }

            this.element.appendChild(card);
            cardHelpers.click(card, { _id });

            html({} as any);
            setTimeout(() => fetchVQL(`api video-static-quick! s._id = ${_id}`).then(html), i * 10);
        });
    }

    mount(): void {
        this.element = qs("#recommendations")!;
    }
}

const recommendationPanel = new RecommendationPanel();
export default recommendationPanel;