import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import { loadVideo } from "#ui/video/player/status";
import { getThumbnail, formatTime } from "#utils";
import { UiComponent } from "@wxn0brp/flanker-ui";
import metaControlView from "./metaControl";

class RecommendationPanel implements UiComponent {
    element: HTMLDivElement;
    recommendations: [string, HTMLSpanElement][] = [];

    render(videos: string[]) {
        this.element.innerHTML = "";
        this.recommendations = [];
        const nextVideoId = $store.nextVideoId.get();

        if ($store.lastVideos.get().length) {
            const lastVideos = new Set($store.lastVideos.get());
            const notIn = videos.filter(x => !lastVideos.has(x));
            const inLast = videos.filter(x => lastVideos.has(x));
            if (inLast.includes(nextVideoId)) 
                $store.nextVideoId.set(notIn[0] || null);

            videos = [...notIn, ...inLast];
        }

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
                    <div class="btns">
                        <button class="btn" data-id="play-next-btn">
                            Play next
                            <span data-id="play-next">${_id === nextVideoId ? "✅" : "❌"}</span>
                        </button>
                        <button class="btn" data-id="playlist">Playlist 📂</button>
                    </div>
                `;

                card.querySelector(`[data-id=playlist]`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    metaControlView.toggleToPlayList(_id);
                });

                card.querySelector(`[data-id=play-next-btn]`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    $store.nextVideoId.set(_id);
                });

                const playNext = card.querySelector<HTMLSpanElement>("[data-id=play-next]");
                recommendationPanel.recommendations[i] = [_id, playNext];
            }

            this.element.appendChild(card);

            card.onclick = () => {
                loadVideo(_id);
            };

            card.oncontextmenu = (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + _id);
            };

            html({} as any);
            setTimeout(() => fetchVQL(`api video-static-quick! s._id = ${_id}`).then(html), i * 10);
        });
    }

    mount(): void {
        this.element = document.querySelector("#recommendations")!;

        $store.nextVideoId.subscribe(id => {
            this.recommendations.forEach(item => {
                if (!item || item.length < 2) return;
                item[1].innerHTML = id === item[0] ? "✅" : "❌";
            });
        });
    }
}

const recommendationPanel = new RecommendationPanel();
export default recommendationPanel;