import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { Setting } from "#types/setting";
import { uiMsg } from "#ui/modal/message";

export const settingsData: Setting[] = [
    {
        type: "select",
        text: "Quality",
        names: ["Best quality", "1080p", "720p", "480p", "360p", "240p", "144p"],
        values: ["best", "1080", "720", "480", "360", "240", "144"],
        storeField: $store.settings.quality,
        id: "app_quality",
    },
    {
        type: "input",
        id: "app_recommendations",
        text: "Recommendations Count",
        storeField: $store.settings.recommendations,
        input_type: "number",
        min: 0,
        max: 20,
    },
    { type: "separator" },
    {
        type: "header",
        text: "Algorithm",
    },
    {
        type: "input",
        id: "alg_minHistory",
        text: "Minimum History Count",
        input_type: "number",
        min: 1,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_maxKeywords",
        text: "Max Keywords",
        input_type: "number",
        min: 1,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_keywordMinFreq",
        text: "Keyword Minimum Frequency",
        input_type: "number",
        min: 1,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_videoPerTag",
        text: "Count of Videos Per Tag",
        input_type: "number",
        min: 1,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_noisePercent",
        text: "Noise Percentage",
        input_type: "number",
        min: 0,
        max: 100,
    },
    {
        type: "input",
        id: "alg_noiseBoost",
        text: "Noise Boost",
        input_type: "number",
        min: 1,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_hashTagBoost",
        text: "Hash Tag Weight",
        input_type: "number",
        min: 0,
        max: 9999,
    },
    {
        type: "input",
        id: "alg_minScore",
        text: "Video Minimum Score",
        input_type: "number",
        min: 0,
        max: 9999,
    },
    {
        type: "textarea",
        id: "alg_irrelevant",
        text: "Irrelevant Tags",
        placeholder: "New line separated",
        width: 15,
        height: 5,
        saveButton: {
            onClick: async (value) => {
                const val = value.split("\n").map(v => v.trim()).filter(v => v.length > 0).join(",");
                await fetchVQL(`alg updateOneOrAdd cfg s._id=irrelevant u.v=${val}`);
                uiMsg("Saved");
            },
        }
    }
]