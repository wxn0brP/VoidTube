import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { incrementCell, decrementCell } from "@wxn0brp/flanker-ui/storeUtils";

class LoaderView implements UiComponent {
	element: HTMLDivElement;
	valueSpan: HTMLSpanElement;

	mount() {
		this.element = qs("#loader");
		this.valueSpan = qs("#loader-value");

		$store.loader.subscribe(open => {
			this.element.style.opacity = open > 0 ? "1" : "0";
			this.valueSpan.textContent = open.toString();
		});
	}

	on() {
		incrementCell($store.loader);
	}

	off() {
		decrementCell($store.loader);
	}
}

const loaderView = new LoaderView();
export default loaderView;
