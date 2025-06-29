import { $store } from "#store";
import { FeedEntry } from "#types/video";
import { clearQueryParams, fewItems, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";
import { fetchVQL } from "#api/index";
import { loadVideo } from "#ui/video/player/status";
import channelView from "./channel";
import metaControlView from "#ui/video/metaControl";
import { mgl } from "#mgl";
import queuePanel from "#ui/video/queue";

class FeedView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(feed: FeedEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, feed.length);

        if (!feed.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No feed</h1>`;
            return;
        }

        feed
            .map(entry => {
                return {
                    ...entry,
                    last: new Date(entry.pubDate).getTime()
                }
            })
            .sort((a, b) => b.last - a.last)
            .forEach(entry => {
                const card = document.createElement("div");
                card.className = "feedCard";
                card.clA("card");
                const id = entry.id;

                card.innerHTML = `
                    <div style="background-image: url(https://i3.ytimg.com/vi/${id}/maxresdefault.jpg)" class="img"></div>
                    <h3 title="${entry.title}">${entry.title}</h3>
                    <p>${new Date(entry.pubDate).toLocaleString()}</p>
                    <div class="author">
                        <img src="${"/avatar?link=" + entry.channel.avatar}" class="avatar">
                        <a href="/?channel=${entry.authorId}">${entry.author}</a>
                    </div>
                    <div class="btns">
                        <button button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `

                card.addEventListener("click", () => {
                    $store.playlistId.set("");
                    $store.playlist.set([]);
                    $store.playlistIndex.set(0);
                    clearQueryParams();
                    loadVideo(id);
                });

                card.addEventListener("contextmenu", (e) => {
                    e.preventDefault();
                    window.open(window.location.origin + "/?v=" + id);
                });

                card.querySelector(`.author`)!.addEventListener("click", (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    channelView.load(entry.authorId);
                });

                card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    metaControlView.toggleToPlayList(id, e);
                });

                this.container.appendChild(card);
            });
    }

    public async loadFeed() {
        const feed = await fetchVQL<FeedEntry[]>(`
api quickFeed
search:
  id: 0
relations:
  channel:
    path: [api, channelInfo]
    fk: id
    pk: authorId
    select: [avatar]
    type: "11"

many: true
`);
        this.render(feed);
        return feed;
    }

    mount(): void {
        this.element = document.querySelector("#feed-view");
        this.container = this.element.querySelector("#feed-container")!;

        uiHelpers.storeHide(this.element, $store.view.feed);
        $store.view.feed.set(false);

        setTimeout(() => this.loadFeed(), window.location.search.length > 0 ? 5_000 : 10);

        document.querySelector("#show-feed-button").addEventListener("dblclick", () => {
            this.loadFeed();
        });
    }

    show() {
        changeView("feed");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("feed");
    }
}

const feedView = new FeedView();
export default feedView;

mgl.feedShow = feedView.show;