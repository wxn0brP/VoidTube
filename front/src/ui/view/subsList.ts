import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { UserSub } from "#types/channel";
import { filterCards } from "#ui/helpers/card";
import navBarView from "#ui/navBar";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, number2HumanFormatter, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import channelView from "./channel";
import "./subsList.scss";

class SubsListView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;
    searchInput: HTMLInputElement;

    render(subs: UserSub[]) {
        this.container.innerHTML = "";

        if (!subs.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Subs</h1>`;
            this.searchInput.style.display = "none";
            return;
        } else {
            this.searchInput.style.display = "";
        }

        subs.forEach((sub) => {
            const card = document.createElement("div");
            card.className = "subCard";
            card.clA("card");
            card.innerHTML = `
                <div style="background-image: url(${sub.channel.avatar})" class="img"></div>
                <h3 title="${sub.channel.name}">${sub.channel.name}</h3>
                <span>${number2HumanFormatter.format(sub.channel.subscribers)} subs</span>
            `;
            this.container.appendChild(card);

            card.addEventListener("click", () => {
                channelView.load($store.video.get().channel);
            });

            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?channel=" + $store.video.get().channel, "_blank");
            });
        });
    }

    mount(): void {
        this.element = document.querySelector("#subs-list-view");
        this.container = this.element.querySelector("#subs-list-container")!;
        this.searchInput = this.element.querySelector("#subs-list-search")!;
        this.searchInput.style.display = "none";

        document.querySelector("#show-subs-button").addEventListener("dblclick", () => {
            this.load();
        });

        uiHelpers.storeHide(this.element, $store.view.subs);
        $store.view.subs.set(false);

        setTimeout(() => {
            this.load();
        }, 100);

        filterCards(this);
    }

    async load() {
        const subs = await fetchVQL<UserSub[]>(`
user subs
relations:
  channel:
    path: [api, channelInfo]
    fk: id
    type: "11"

search: {}
many: true
`);
        this.render(subs);
    }

    show() {
        changeView("subs");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("subs");
    }
}

const subsListView = new SubsListView();
export default subsListView;

mgl.subsListShow = subsListView.show;