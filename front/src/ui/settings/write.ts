import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { settingsData } from "./data";

export default async function (container: HTMLDivElement) {
    const settingsValues = await fetchVQL<{ _id: string, value: string }[]>("user settings");
    const algSettings = await fetchVQL<{ _id: string, v: string }[]>("alg cfg");

    container.querySelectorAll("[data-setting-id]").forEach(element => {
        const settingId = element.getAttribute("data-setting-id")!;

        if (settingId.startsWith("app_")) {
            const id = settingId.replace("app_", "");
            const setting = settingsValues.find(setting => setting._id === id);
            if ($store.settings[id]) {
                setting ? $store.settings[id].set(setting.value) : $store.settings[id].set($store.settings[id].get());
            }
        } else if (settingId.startsWith("alg_")) {
            const id = settingId.replace("alg_", "");
            const setting = algSettings.find(setting => setting._id === id);
            if (!setting) return;
            // @ts-ignore
            const settingCfg: { type: string } = settingsData.find(setting => setting.id === settingId);
            if (settingCfg.type === "input") {
                const input = element.querySelector<HTMLInputElement>("input")!;
                input.value = setting.v || "";
                input.oninput = () => {
                    fetchVQL(`alg updateOneOrAdd cfg s._id="${id}" u.v="${input.value}"`);
                }
            } else if (settingCfg.type === "textarea") {
                const input = element.querySelector<HTMLTextAreaElement>("textarea")!;
                input.value = setting.v.replaceAll(",", "\n");
            }
        }
    });

}