import { ReactiveCell } from "@wxn0brp/flanker-ui";

export type Setting = SettingSelect | SettingButton | SettingInput;

export interface SettingSelect {
    type: "select";
    text: string;
    names: string[];
    values: string[];
    storeField: ReactiveCell<string>;
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
    storeField: ReactiveCell<string>;
    id: string;
    input_type?: "text" | "number";
    min?: number;
    max?: number;
}