import { fetchVQL } from "#api/index";
import { settingsData } from "./data";
import { createSelect, createButton, createInput, createTextArea, createCheckbox } from "./helpers";

export default function (container: HTMLDivElement) {
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
            case "separator":
                element = document.createElement("hr");
                break;
            case "header":
                element = document.createElement("h2");
                element.innerText = setting.text;
                break;
            case "div":
                element = document.createElement("div");
                element.id = "settings-" + setting.id;
                break;
            case "textarea":
                element = createTextArea(setting);
                break;
            case "checkbox":
                element = createCheckbox(setting);
                break;
            default:
                throw new Error("Unknown setting type");
        }

        container.appendChild(element);

        if ("storeField" in setting && "id" in setting) {
            setting.storeField.subscribe(() => {
                fetchVQL(`user updateOneOrAdd settings s._id="${setting.id.replace("app_","")}" u.value=${setting.storeField.get()}`);
            });
        }

        if ("id" in setting) {
            element.setAttribute("data-setting-id", setting.id);
            element.setAttribute("data-setting-type", setting.type);
        }
    });
} 