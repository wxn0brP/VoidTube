import { fetchHistory } from "#api/history";
import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { HistoryEntry, HistoryEntryInfo } from "#types/video";
import { cardHelpers, filterCards } from "#ui/helpers/card";
import queuePanel from "#ui/video/queue";
import {
	clearQueryParams,
	fewItems,
	formatTime,
	getThumbnail,
	numToLocale,
	setTitle,
} from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import uiFunc from "../modal";
import navBarView from "../navBar";
import { thumbnailMiddle } from "./channel";
import { VQL_OP_Find } from "@wxn0brp/vql-client/vql";

type HistoryEntryWithInfo = HistoryEntry & {
	info: HistoryEntryInfo;
};

function hasInfo(entry: HistoryEntry): entry is HistoryEntryWithInfo {
	return !!entry.info;
}

function formatUploadDate(raw?: string | null) {
	if (!raw || raw.length < 8) return "";
	return `${raw.slice(6, 8)}.${raw.slice(4, 6)}.${raw.slice(0, 4)}`;
}

class HistoryView implements UiComponent {
	element: HTMLDivElement;
	container: HTMLDivElement;
	searchInput: HTMLInputElement;
	hasMore = true;
	page = 0;
	loading = false;
	threshold = 1000;

	render(history: HistoryEntry[]) {
		const elementsCount = Math.max(history.length, this.page * 32);
		fewItems(this.container, elementsCount);

		if (elementsCount === 0) {
			this.container.innerHTML = `<h1 style="text-align: center;" id="history-empty">No history</h1>`;
			this.searchInput.style.display = "none";
			return;
		} else {
			this.searchInput.style.display = "";
			this.container.qs("#history-empty")?.remove();
		}

		history
			.filter(hasInfo)
			.sort((a, b) => b.last - a.last)
			.forEach(entry => {
				const card = document.createElement("div");
				card.className = "historyCard";
				card.clA("card");
				card.dataset.id = entry._id;

				const info = entry.info;
				const date = formatUploadDate(info.uploadDate);
				const channelId = info.channel ?? "";
				const channelName = info.channelData?.name ?? "Unknown";
				const avatar = info.channelData?.avatar;

				card.innerHTML = `
                    <div style="background-image: url(${getThumbnail(info.thumbnail, entry._id)})" class="img"></div>
                    <h3 title="${info.title}">${info.title}</h3>
                    ${formatTime(entry.time, null)} / ${formatTime(info.duration, null)} <br>
                    ${numToLocale(info.views)} views -
                    ${date}
                    <div class="author">
                        ${avatar ? `<img src="${thumbnailMiddle + avatar}" class="avatar">` : ""}
                        ${channelId ? `<a href="/?channel=${channelId}">${channelName}</a>` : `<span>${channelName}</span>`}
                    </div>
                    <div class="btns">
                        <button button title="Queue" class="btn" data-id="queue">Queue➕</button>
                        <button button title="Remove" class="btn rm" data-id="rm">Remove</button>
                        <button button title="Playlist" class="btn" data-id="playlist">📂</button>
                    </div>
                `;

				cardHelpers.click(card, entry);
				if (channelId) cardHelpers.author(card, channelId);
				cardHelpers.queue(card, entry);
				cardHelpers.playlist(card, entry);

				card.qs(`[data-id=rm]`)!.addEventListener("click", async e => {
					e.stopPropagation();
					e.preventDefault();

					const sure = await uiFunc.confirm(
						"Are you sure? You can't undo this",
					);
					if (!sure) return;

					fetchVQL(`user -history s._id = ${entry._id}`).then(() => {
						this.container.removeChild(card);
					});
				});

				this.container.appendChild(card);
			});
	}

	public async clearAndLoad(count = 0) {
		const cfg: VQL_OP_Find["options"] = {
			sortBy: "last",
			sortAsc: false,
		};
		if (count > 0) cfg.limit = count;

		this.loading = true;
		const history = await fetchHistory(cfg);
		this.hasMore = count > 0;
		this.page = Math.ceil(history.length / 32);

		this.container.innerHTML = "";
		this.render(history);
		this.container.scrollTop = 0;
		this.loading = false;

		return history;
	}

	async loadPartialHistory() {
		if (!this.hasMore) return;
		if (this.loading) return;

		this.loading = true;
		const history = await fetchHistory({
			offset: this.page * 32,
			limit: 32,
			sortBy: "last",
			sortAsc: false,
		});
		if (history.length === 0) {
			this.hasMore = false;
			return;
		}
		this.render(history);
		this.page++;
		this.loading = false;
	}

	async appendLastVideo(id: string) {
		let card = this.container.qs(id, 1);
		if (!card) {
			const history = await fetchHistory(null, id);
			this.render(history);
			card = this.container.qs(id, 1);
		}
		if (!card) return;
		this.container.insertBefore(card, this.container.firstChild);
	}

	mount() {
		this.element = qs("#history-view");
		this.container = this.element.qs("#history-container");
		this.searchInput = qs("#history-search");
		this.searchInput.style.display = "none";

		uiHelpers.storeHide(this.element, $store.view.history);
		$store.view.history.set(false);

		// quick load
		setTimeout(() => {
			this.loadPartialHistory();
		}, 100);
		filterCards(this);

		this.container.addEventListener("scroll", () => {
			const { scrollTop, scrollHeight, clientHeight } = this.container;
			if (scrollHeight - scrollTop - clientHeight < this.threshold) {
				this.loadPartialHistory();
			}
		});
	}

	show() {
		changeView("history");
		setTitle("");
		clearQueryParams();
		queuePanel.queryParams();
		navBarView.save("history");
	}
}

const historyView = new HistoryView();
export default historyView;

mgl.historyShow = historyView.show;
