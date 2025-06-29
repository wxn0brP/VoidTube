import { mgl } from "#mgl";
import { $store } from "#store";
import navBarView from "#ui/navBar";
import build from "#ui/settings/build";
import queuePanel from "#ui/video/queue";
import { clearQueryParams, setTitle } from "#utils";
import { UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import "./settings.scss";

class SettingsView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    mount() {
        this.element = document.querySelector("#settings-view")!;
        this.container = this.element.querySelector("#settings-container")!;

        uiHelpers.storeHide(this.element, $store.view.settings);
        $store.view.settings.set(false);

        build(this.container);
    }

    show() {
        changeView("settings");
        setTitle("");
        clearQueryParams();
        queuePanel.queryParams();
        navBarView.save("settings");
    }
}

const settingsView = new SettingsView();
export default settingsView;

mgl.settingsShow = settingsView.show;