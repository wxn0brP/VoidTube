import { $store } from "#store";
import { Setting, SettingButton, SettingInput, SettingSelect } from "#types/setting";
import navBarView from "#ui/navBar";
import { clearQueryParams, setTitle } from "#utils";
import { ReactiveCell, UiComponent, uiHelpers } from "@wxn0brp/flanker-ui";
import { changeView } from "..";
import playListView from "./playList";
import { fetchVQL } from "#api/index";
import { mgl } from "#mgl";
import "./settings.scss";

function createSelect(setting: SettingSelect) {
    const label = document.createElement("label");
    label.innerHTML = "<b>" + setting.text + "</b>";

    const select = document.createElement("select");

    const options = document.createDocumentFragment();
    for (let i = 0; i < setting.names.length; i++) {
        const option = document.createElement("option");
        option.value = setting.values[i];
        option.innerText = setting.names[i] || setting.values[i];
        options.appendChild(option);
    }
    select.appendChild(options);
    uiHelpers.watchSelect(select, setting.storeField);
    label.appendChild(select);
    return label;
}

function createButton(setting: SettingButton) {
    const button = document.createElement("button");
    button.innerText = setting.text;
    button.onclick = setting.onClick;
    return button;
}

function createInput(setting: SettingInput) {
    const label = document.createElement("label");
    label.innerHTML = "<b>" + setting.text + "</b>";

    const input = document.createElement("input");
    input.type = setting.input_type || "text";
    if (setting.placeholder) input.placeholder = setting.placeholder;
    uiHelpers.watchInput(input, setting.storeField);
    label.appendChild(input);

    if (setting.input_type === "number") {
        if (setting.max !== undefined) input.max = setting.max.toString();
        if (setting.min !== undefined) input.min = setting.min.toString();
        console.log(setting.max, setting.min);
    } else if (setting.input_type === "text") {
        if (setting.max !== undefined) input.maxLength = setting.max;
        if (setting.min !== undefined) input.minLength = setting.min;
    }

    return label;
}

class SettingsView implements UiComponent {
    element: HTMLDivElement;
    container: HTMLDivElement;

    mount() {
        this.element = document.querySelector("#settings-view")!;
        this.container = this.element.querySelector("#settings-container")!;

        uiHelpers.storeHide(this.element, $store.view.settings);
        $store.view.settings.set(false);

        this.createSettings();
    }

    show() {
        changeView("settings");
        setTitle("");
        clearQueryParams();
        playListView.queryParams();
        navBarView.save("settings");
    }

    private async createSettings() {
        const settingsData: Setting[] = [
            {
                type: "select",
                text: "Quality",
                names: ["Best quality", "1080p", "720p", "480p", "360p", "240p", "144p"],
                values: ["best", "1080", "720", "480", "360", "240", "144"],
                storeField: $store.settings.quality,
                id: "quality",
            },
            {
                type: "input",
                id: "recommendations",
                text: "Recommendations Count",
                storeField: $store.settings.recommendations,
                input_type: "number",
                min: 0,
                max: 20,
            }
        ]

        settingsData.forEach(setting => {
            let element: HTMLElement;
            switch (setting.type) {
                case "select":
                    element = createSelect(setting);
                    break;
                case "button":
                    element = createButton(setting);
                    break;
                case "input":
                    element = createInput(setting);
                    break;
                default:
                    throw new Error("Unknown setting type");
            }

            this.container.appendChild(element);

            if ("storeField" in setting && "id" in setting) {
                setting.storeField.subscribe(() => {
                    fetchVQL(`user updateOneOrAdd settings s._id="${setting.id}" u.value=${setting.storeField.get()}`);
                });
            }

            if ("id" in setting) {
                element.setAttribute("data-setting-id", setting.id);
                element.setAttribute("data-setting-type", setting.type);
            }
        });

        const settingsValues = await fetchVQL<{ _id: string, value: string }[]>("user settings");
        this.container.querySelectorAll("[data-setting-id]").forEach(element => {
            const settingId = element.getAttribute("data-setting-id")!;
            const setting = settingsValues.find(setting => setting._id === settingId);
            if (setting) {
                $store.settings[settingId].set(setting.value);
            } else {
                $store.settings[settingId].set($store.settings[settingId].get());
            }
        });
    }
}

const settingsView = new SettingsView();
export default settingsView;

mgl.settingsShow = settingsView.show;