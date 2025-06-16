import { SettingSelect, SettingButton, SettingInput, SettingTextArea } from "#types/setting";
import { uiHelpers } from "@wxn0brp/flanker-ui";

export function createSelect(setting: SettingSelect) {
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
    if (setting.storeField) uiHelpers.watchSelect(select, setting.storeField);
    label.appendChild(select);
    return label;
}

export function createButton(setting: SettingButton) {
    const button = document.createElement("button");
    button.innerText = setting.text;
    button.onclick = setting.onClick;
    return button;
}

export function createInput(setting: SettingInput) {
    const label = document.createElement("label");
    label.innerHTML = "<b>" + setting.text + "</b>";

    const input = document.createElement("input");
    input.type = setting.input_type || "text";
    if (setting.placeholder) input.placeholder = setting.placeholder;
    if (setting.storeField) uiHelpers.watchInput(input, setting.storeField);
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

export function createTextArea(setting: SettingTextArea) {
    const div = document.createElement("div");
    div.innerHTML = "<b>" + setting.text + "</b>";

    if (setting.saveButton) {
        const button = document.createElement("button");
        button.css({ marginLeft: "10px" });
        button.clA("btn");
        button.innerText = setting.saveButton.text || "Save";
        button.onclick = (e) => {
            setting.saveButton.onClick(textarea.value, e);
        };
        div.appendChild(button);
    }
    div.appendChild(document.createElement("br"));

    const textarea = document.createElement("textarea");
    if (setting.placeholder) textarea.placeholder = setting.placeholder;
    if (setting.storeField) uiHelpers.watchInput(textarea as any, setting.storeField);
    div.appendChild(textarea);

    if (setting.width) textarea.cols = setting.width;
    if (setting.height) textarea.rows = setting.height;

    return div;
}
