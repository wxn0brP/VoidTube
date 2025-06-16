import { ReactiveCell } from "@wxn0brp/flanker-ui";

export type Setting = SettingSelect | SettingButton | SettingInput | Separator | Header | Div | SettingTextArea;

export interface SettingSelect {
    type: "select";
    text: string;
    names: string[];
    values: string[];
    storeField?: ReactiveCell<string>;
    id: string;
}

export interface SettingButton {
    type: "button";
    text: string;
    onClick: () => void;
}

export interface SettingInput {
    type: "input";
    text: string;
    placeholder?: string;
    storeField?: ReactiveCell<string>;
    id: string;
    input_type?: "text" | "number";
    min?: number;
    max?: number;
}

export interface Separator {
    type: "separator";
}

export interface Header {
    type: "header";
    text: string;
}

export interface Div {
    type: "div";
    id: string;
}

export interface SettingTextArea {
    type: "textarea";
    text: string;
    placeholder?: string;
    storeField?: ReactiveCell<string>;
    id: string;
    width?: number;
    height?: number;
    saveButton?: {
        text?: string;
        onClick: (value: string, e: Event) => void;
    }
}