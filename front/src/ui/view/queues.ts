import { mgl } from "#mgl";
import { $store } from "#store";
import { VideoQuickInfo } from "#types/video";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, fewItems, getThumbnail, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { fetchVQL } from "@wxn0brp/vql-client";
import { changeView } from "..";
import navBarView from "../navBar";
import { getQueuesMesh, joinGroup } from "#ui/video/queue/sync";
import uiFunc from "#ui/modal";

class QueueView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    async render(queuesMap: Map<string, string>) {
        fewItems(this.container, queuesMap.size);

        if (!queuesMap.size) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Queue Clients</h1>`;
            return;
        }

        const videoIds = [...queuesMap.values()];
        const videoDataMap = new Map<string, VideoQuickInfo>();
        const missing = [];

        const cmp = queuePanel;

        videoIds.forEach(id => {
            cmp.videoMap.has(id) ?
                videoDataMap.set(id, cmp.videoMap.get(id)) :
                missing.push(id);
        });

        if (missing.length) {
            const info = await fetchVQL({
                query: "api video-static-quick s.$in._id = $_id",
                var: {
                    _id: missing
                }
            });
            for (const item of info) {
                cmp.videoMap.set(item._id, item);
                videoDataMap.set(item._id, item);
            }
        }

        this.container.innerHTML = "";
        queuesMap.forEach((videoId, groupId) => {
            const data = videoDataMap.get(videoId);
            if (!data) return;

            const card = document.createElement("div");
            card.className = "feedCard";
            card.clA("card");
            const inThisGroup = groupId === $store.queueGroup.get();

            card.innerHTML = `
                <div style="background-image: url(${getThumbnail(data.thumbnail, data._id)})" class="img"></div>
                <h3 class="queue-group-name">${groupId}</h3>
                <h4 title="${data.title}">${data.title}</h4>
                <span style="color: ${inThisGroup ? "green" : "red"};">${inThisGroup ? "In" : "Not in"} this group</span>
            `;

            card.addEventListener("click", async () => {
                const confirm = await uiFunc.confirm(`Do you want to join the queue group "${groupId}"?`);
                if (!confirm) return;
                joinGroup(groupId);
            });

            this.container.appendChild(card);
        });
    }

    async fetchQueues() {
        const queuesMap = await getQueuesMesh();
        this.render(queuesMap);
        return queuesMap;
    }

    mount(): void {
        this.element = document.querySelector("#queues-view");
        this.container = this.element.querySelector("#queues-container")!;

        uiHelpers.storeHide(this.element, $store.view.queues);
        $store.view.queues.set(false);

        const btn = document.querySelector("#show-queues-button");
        btn.addEventListener("click", () => {
            this.fetchQueues();
            this.show();
        });

        this.element.querySelector("#queues-exit-button").addEventListener("click", async () => {
            const confirm = await uiFunc.confirm("Do you want to leave the queue group?");
            if (!confirm) return;
            joinGroup();
        });

        const queuesExitName = this.element.querySelector("#queues-exit-name");
        $store.queueGroup.subscribe((id) => {
            queuesExitName.textContent = id;
            btn.setAttribute("title", id);
        });
    }

    show() {
        changeView("queues");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("queues");
    }
}

const queueView = new QueueView();
export default queueView;

mgl.queueShow = queueView.show;
