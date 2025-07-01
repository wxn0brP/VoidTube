import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { AlgEntry } from "#types/video";
import { cardHelpers } from "#ui/helpers/card";
import { uiMsg } from "#ui/modal/message";
import navBarView from "#ui/navBar";
import { fewItems, formatTime, numToLocale, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";

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
            card.clA("card");

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3 title="${entry.title}">${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views <br>
                <span data-id="scores" style="cursor: help; text-decoration: underline">Result score</span>
                <div class="author">
                    <img src="${"/avatarTry?id=" + entry.channel}" class="avatar">
                    <a href="/?channel=${entry.channel}">${entry.channelName}</a>
                </div>
                <div class="btns">
                    <button class="btn" data-id="queue">Queue➕</button>
                    <button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `
            card.querySelector<HTMLSpanElement>("[data-id=scores]")!.title = `score: ${entry.score}
tags:
${entry.tags.map(t => `- ${t}`).join("\n")}
            `.trim();

            cardHelpers.click(card, entry);
            cardHelpers.queue(card, entry);
            cardHelpers.playlist(card, entry);
            cardHelpers.author(card, entry.channel);
            cardHelpers.avatarTry(card);

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

        uiHelpers.storeHide(this.element, $store.view.alg);
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