import { fetchVQL } from "#api/index";
import { settingsData } from "./data";
import { createSelect, createButton, createInput, createTextArea, createCheckbox } from "./helpers";

export default async function (container: HTMLDivElement) {
    const settingsValues = await fetchVQL<{ _id: string, v: string }[]>("user settings");

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

        if (!("id" in setting)) return;

        const settingValue = settingsValues.find(s => s._id === setting.id);
        let value = settingValue?.v ?? ("storeField" in setting && setting.storeField.get());

        switch (setting.type) {
            case "input":
                element.querySelector<HTMLInputElement>("input")!.value = value as string;
                break;
            case "select":
                value = value.toString();
                element.querySelector<HTMLSelectElement>("select")!.value = value;
                break;
            case "textarea":
                value = (value as string || "").split(",").map(v => v.trim()).join("\n");
                element.querySelector<HTMLTextAreaElement>("textarea")!.value = value;
                break;
            case "checkbox":
                value = typeof value === "boolean" ? value : value === "true";
                element.querySelector<HTMLInputElement>("input[type='checkbox']")!.checked = value;
                break;
            default:
                console.warn(`Unknown setting type: ${setting.type}`);
                break;
        }

        if ("storeField" in setting) {
            // @ts-ignore
            setting.storeField.set(value);
            setting.storeField.subscribe(newValue => {
                fetchVQL(`user updateOneOrAdd settings s._id="${setting.id}" u.v="${newValue}"`);
            });
        }
    });
} 