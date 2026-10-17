import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import { $store } from "#store";
import { clearQueryParams, formatTime, numToLocale, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import navBarView from "../navBar";
import "./stats.scss";

interface ChannelStats {
	id: string;
	name: string;
	count: number;
	time: number;
}

interface StatsResult {
	totalVideos: number;
	totalTime: number;
	perChannel: ChannelStats[];
}

class StatsView implements UiComponent {
	element: HTMLDivElement;
	container: HTMLDivElement;

	async refresh() {
		const stats = await fetchVQL<StatsResult>("api stats! s._id=1");
		this.render(stats);
	}

	render(stats: StatsResult) {
		this.container.innerHTML = "";

		if (!stats || !stats.totalVideos) {
			this.container.innerHTML = `<h1 style="text-align: center;">No data</h1>`;
			return;
		}

		const maxTime = Math.max(
			1,
			...stats.perChannel.map(channel => channel.time),
		);

		const summary = document.createElement("div");
		summary.className = "stats-summary";
		summary.innerHTML = `
            <div class="stat-box"><b>${numToLocale(stats.totalVideos)}</b><span>Videos watched</span></div>
            <div class="stat-box"><b>${formatTime(stats.totalTime, true)}</b><span>Total watch time</span></div>
            <div class="stat-box"><b>${numToLocale(stats.perChannel.length)}</b><span>Channels</span></div>
        `;
		this.container.appendChild(summary);

		const heading = document.createElement("h2");
		heading.textContent = "Top channels";
		this.container.appendChild(heading);

		for (const channel of stats.perChannel) {
			const row = document.createElement("div");
			row.className = "stats-row";
			row.innerHTML = `
                <img class="avatar" src="/avatarTry?id=${channel.id}" alt="">
                <div class="stats-info">
                    <a href="/?channel=${channel.id}">${channel.name}</a>
                    <div class="stats-bar">
                        <div class="stats-bar-fill" style="width: ${(channel.time / maxTime) * 100}%"></div>
                    </div>
                </div>
                <div class="stats-value">
                    <span>${formatTime(channel.time, true)}</span>
                    <small>${numToLocale(channel.count)} videos</small>
                </div>
            `;
			this.container.appendChild(row);
		}
	}

	mount() {
		this.element = qs("#stats-view");
		this.container = this.element.qs("#stats-container");

		uiHelpers.storeHide(this.element, $store.view.stats);
		$store.view.stats.set(false);
	}

	show() {
		changeView("stats");
		setTitle("");
		clearQueryParams();
		navBarView.save("stats");
		this.refresh();
	}
}

const statsView = new StatsView();
export default statsView;

mgl.statsShow = () => statsView.show();
