import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { ActiveDownload, DownloadEntry } from "#types/video";
import { clearQueryParams, fewItems, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";
import uiFunc from "../modal";
import "./downloads.scss";

class DownloadsView implements UiComponent {
	element: HTMLDivElement;
	container: HTMLDivElement;
	activeContainer: HTMLDivElement;
	historyContainer: HTMLDivElement;
	pollTimer: ReturnType<typeof setInterval> | null = null;
	lastActiveIds: string[] = [];
	visible = false;

	private async fetchActive(): Promise<ActiveDownload[]> {
		return fetchVQL<ActiveDownload[]>({
			query: "api downloadStatus s.id = 0",
		});
	}

	private async fetchHistory(): Promise<DownloadEntry[]> {
		return fetchVQL<DownloadEntry[]>({
			query: "api downloadHistory s.id = 0",
		});
	}

	private updateActive(active: ActiveDownload[]) {
		const currentIds = active.map(e => e.id);

		const sameIds =
			currentIds.length === this.lastActiveIds.length &&
			currentIds.every((id, i) => id === this.lastActiveIds[i]);

		if (sameIds && active.length > 0) {
			for (const entry of active) {
				const card = this.activeContainer.querySelector(
					`[data-dl-id="${entry.id}"]`,
				);
				if (!card) continue;

				const bar = card.querySelector(".progress-bar") as HTMLElement;
				if (bar) bar.style.width = entry.progress + "%";

				const pct = card.querySelector(".dl-pct");
				if (pct) pct.textContent = entry.progress.toFixed(1) + "%";

				const speed = card.querySelector(".dl-speed");
				if (speed) speed.textContent = entry.speed || "";

				const eta = card.querySelector(".dl-eta");
				if (eta) eta.textContent = entry.eta ? `ETA ${entry.eta}` : "";
			}
			return;
		}

		this.lastActiveIds = currentIds;
		this.activeContainer.innerHTML = "";

		if (active.length === 0) {
			this.activeContainer.style.display = "none";
			return;
		}

		this.activeContainer.style.display = "";
		fewItems(this.activeContainer, active.length);

		for (const entry of active) {
			const card = document.createElement("div");
			card.className = "downloadCard";
			card.clA("card");
			card.dataset.dlId = entry.id;

			card.innerHTML = `
				<h3 title="${entry.title}">${entry.title}</h3>
				<div class="progress">
					<div class="progress-bar" style="width: ${entry.progress}%"></div>
				</div>
				<div class="dl-meta">
					<span class="dl-pct">${entry.progress.toFixed(1)}%</span>
					<span class="dl-speed">${entry.speed}</span>
					<span class="dl-eta">${entry.eta ? `ETA ${entry.eta}` : ""}</span>
					<span class="dl-total">${entry.total}</span>
					<span class="dl-format">${entry.format.toUpperCase()}</span>
				</div>
				<div class="btns">
					<button title="Cancel" class="btn rm" data-id="cancel">Cancel</button>
				</div>
			`;

			card
				.querySelector<HTMLButtonElement>("[data-id=cancel]")!
				.addEventListener("click", async e => {
					e.stopPropagation();
					e.preventDefault();
					await fetchVQL(`api -downloadCancel! s.id = ${entry.id}`);
				});

			this.activeContainer.appendChild(card);
		}
	}

	private updateHistory(history: DownloadEntry[]) {
		this.historyContainer.innerHTML = "";

		if (history.length === 0) {
			this.historyContainer.style.display = "none";
			return;
		}

		this.historyContainer.style.display = "";

		const heading = document.createElement("h2");
		heading.textContent = "History";
		this.historyContainer.appendChild(heading);

		const self = this;
		const clearBtn = document.createElement("button");
		clearBtn.className = "btn dl-clear-btn";
		clearBtn.textContent = "Clear history";
		clearBtn.addEventListener("click", async e => {
			e.stopPropagation();
			e.preventDefault();
			const sure = await uiFunc.confirm("Are you sure? You can't undo this");
			if (!sure) return;
			await fetchVQL(`api -downloadHistory-rm! s.id = 0`);
			self.refresh();
		});
		this.historyContainer.appendChild(clearBtn);

		for (const entry of history) {
			const card = document.createElement("div");
			card.className = "downloadCard historyCard";
			card.clA("card");

			card.innerHTML = `
				<h3 title="${entry.title}">${entry.title}</h3>
				<div class="dl-meta">
					<span class="dl-status ${entry.status}">${entry.status}</span>
					<span class="dl-format">${entry.format.toUpperCase()}</span>
					${entry.error ? `<span class="dl-error">${entry.error}</span>` : ""}
				</div>
				<div class="btns">
					<button title="Remove" class="btn rm" data-id="rm">Remove</button>
				</div>
			`;

			card
				.querySelector<HTMLButtonElement>("[data-id=rm]")!
				.addEventListener("click", async e => {
					e.stopPropagation();
					e.preventDefault();
					await fetchVQL(`api -downloadHistory-rm! s.id = ${entry._id}`);
					self.refresh();
				});

			this.historyContainer.appendChild(card);
		}
	}

	async refresh() {
		const [active, history] = await Promise.all([
			this.fetchActive(),
			this.fetchHistory(),
		]);
		this.updateActive(active);
		this.updateHistory(history);
	}

	private startPoll() {
		this.stopPoll();
		this.pollTimer = setInterval(() => {
			if (!this.visible) return;
			this.fetchActive().then(active => this.updateActive(active));
		}, 500);
	}

	private stopPoll() {
		if (this.pollTimer) {
			clearInterval(this.pollTimer);
			this.pollTimer = null;
		}
	}

	mount(): void {
		this.element = qs("#downloads-view");
		this.container = this.element.querySelector("#downloads-container")!;
		this.activeContainer = this.element.querySelector("#downloads-active")!;
		this.historyContainer = this.element.querySelector("#downloads-history")!;

		uiHelpers.storeHide(this.element, $store.view.downloads);
		$store.view.downloads.set(false);

		$store.view.downloads.subscribe(val => {
			if (!val) this.hide();
		});
	}

	show() {
		changeView("downloads");
		setTitle("");
		clearQueryParams();
		navBarView.save("downloads");
		this.visible = true;
		this.refresh();
		this.startPoll();
	}

	hide() {
		this.visible = false;
		this.stopPoll();
	}
}

const downloadsView = new DownloadsView();
export default downloadsView;

mgl.downloadsShow = () => downloadsView.show();
mgl.downloadsHide = () => downloadsView.hide();
