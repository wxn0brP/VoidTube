import { UiComponent } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { AlgEntry } from "#types/video";
import navBarView from "#ui/navBar";
import metaControlView from "#ui/video/metaControl";
import { loadVideo } from "#ui/video/player/status";
import { fewItems, formatTime, numToLocale, clearQueryParams, updateQueryParam } from "#utils";
import channelView from "./channel";
import { uiMsg } from "#ui/modal/message";

class AlgView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(alg: AlgEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, alg.length);

        if (!alg.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Results</h1>`;
            return;
        }

        alg.forEach(entry => {
            const card = document.createElement("div");
            card.className = "algCard";

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3>${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views
                <div class="author">
                    <img src="${"/avatarTry?id=" + entry.channel}" class="avatar">
                    <a href="/?channel=${entry.channel}">${entry.channelName}</a>
                </div>
                <div class="btns">
                    <button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            card.addEventListener("click", () => {
                $store.playlistId.set("");
                $store.playlist.set([]);
                $store.playlistIndex.set(0);
                clearQueryParams();
                updateQueryParam("v", entry.id);
                loadVideo(entry.id);
            });

            card.addEventListener("contextmenu", (e) => {
                e.preventDefault();
                window.open(window.location.origin + "/?v=" + entry.id);
            });

            card.querySelector(`.author`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                channelView.load(entry.channel);
            });

            card.querySelector(`[data-id=playlist]`)!.addEventListener("click", async (e) => {
                e.stopPropagation();
                e.preventDefault();
                metaControlView.toggleToPlayList(entry.id);
            });

            card.querySelector(`img`).addEventListener("error", () => {
                card.querySelector(`img`).style.display = "none";
            });

            this.container.appendChild(card);
        });
        this.container.classList.toggle("fewItems", alg.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#alg-view");
        this.container = this.element.querySelector("#alg-container")!;

        document.querySelector("#show-alg-button").addEventListener("dblclick", () => {
            this.load();
        });

        $store.view.alg.subscribe((open) => {
            this.element.style.display = open ? "" : "none";
        });

        $store.view.alg.set(false);
    }

    show() {
        changeView("alg");
        updateQueryParam("v", undefined);
        navBarView.save("alg");
    }

    async load() {
        const feed = await fetchVQL(`api algRun! s._id=1`);
        if (!feed || !feed.length) return uiMsg("Error. No results.");
        algView.render(feed);
    }
}

const algView = new AlgView();
export default algView;

mgl.algShow = algView.show;