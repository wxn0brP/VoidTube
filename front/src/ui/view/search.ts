import { mgl } from "#mgl";
import { $store } from "#store";
import { SearchEntry } from "#types/video";
import { cardHelpers } from "#ui/helpers/card";
import navBarView from "#ui/navBar";
import { fewItems, formatTime, numToLocale, updateQueryParam } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";

class SearchView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    render(search: SearchEntry[]) {
        this.container.innerHTML = "";
        fewItems(this.container, search.length);

        if (!search.length) {
            this.container.innerHTML = `<h1 style="text-align: center;">No Results</h1>`;
            return;
        }

        search.forEach(entry => {
            const card = document.createElement("div");
            card.className = "searchCard";
            card.clA("card");

            card.innerHTML = `
                <div style="background-image: url(${entry.thumbnail})" class="img"></div>
                <h3 title="${entry.title}">${entry.title}</h3>
                ${formatTime(entry.duration, null)} <br>
                ${numToLocale(entry.views)} views
                <div class="author">
                    <img src="${"/avatarTry?id=" + entry.channel}" class="avatar">
                    <a href="/?channel=${entry.channel}">${entry.channelName}</a>
                </div>
                <div class="btns">
                    <button class="btn" data-id="queue">Queue➕</button>
                    <button title="Add to playlist" class="btn" data-id="playlist">📂</button>
                </div>
            `

            cardHelpers.click(card, entry);
            cardHelpers.rightClick(card, entry);
            cardHelpers.queue(card, entry);
            cardHelpers.playlist(card, entry);
            cardHelpers.author(card, entry.channel);
            cardHelpers.avatarTry(card);

            this.container.appendChild(card);
        });
        this.container.classList.toggle("fewItems", search.length <= 3);
    }

    mount(): void {
        this.element = document.querySelector("#search-view");
        this.container = this.element.querySelector("#search-container")!;

        uiHelpers.storeHide(this.element, $store.view.search);
        $store.view.search.set(false);
    }

    show() {
        changeView("search");
        updateQueryParam("v", undefined);
        navBarView.save("search");
    }
}

const searchView = new SearchView();
export default searchView;

mgl.searchShow = searchView.show;