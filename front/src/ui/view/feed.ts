import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { FeedEntry } from "#types/video";
import { cardHelpers } from "#ui/helpers/card";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, fewItems, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";

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
                        <button class="btn" data-id="queue">Queue➕</button>
                        <button button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `;

                cardHelpers.click(card, entry);
                cardHelpers.author(card, entry.authorId);
                cardHelpers.queue(card, entry);
                cardHelpers.playlist(card, entry);

                this.container.appendChild(card);
            });
    }

    public async loadFeed() {
        const feed = await fetchVQL<FeedEntry[]>({
            r: {
                path: ["api", "quickFeed"],
                search: {
                    id: 0
                },
                relations: {
                    channel: {
                        path: ["api", "channelInfo"],
                        fk: "id",
                        pk: "authorId",
                        select: ["avatar"],
                        type: "11"
                    }
                },
                many: true
            }
        })
        this.render(feed);
        return feed;
    }

    mount(): void {
        this.element = qs("#feed-view");
        this.container = this.element.querySelector("#feed-container")!;

        uiHelpers.storeHide(this.element, $store.view.feed);
        $store.view.feed.set(false);

        setTimeout(() => this.loadFeed(), window.location.search.length > 0 ? 5_000 : 10);

        qs("#show-feed-button").addEventListener("dblclick", () => {
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