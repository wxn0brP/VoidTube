import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { Setting } from "#types/setting";
import uiFunc from "#ui/modal";
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
    {
        type: "checkbox",
        id: "app_onePlay",
        text: "One Play",
        storeField: $store.settings.onePlay,
    },
    {
        type: "input",
        id: "app_searchLanguage",
        text: "Search Language",
        storeField: $store.settings.searchLanguage,
        input_type: "text",
        placeholder: "eg. en",
    },
    {
        type: "input",
        id: "app_searchCountry",
        text: "Search Country",
        storeField: $store.settings.searchCountry,
        input_type: "text",
        placeholder: "eg. US",
    },
    {
        type: "checkbox",
        id: "app_sponsorBlock",
        text: "Sponsor Block",
        storeField: $store.settings.sponsorBlock.enabled,
    },
    {
        type: "checkbox",
        id: "app_sponsorBlockFull",
        text: "Sponsor Block Full Area Trigger Mode",
        storeField: $store.settings.sponsorBlock.full,
    },
    {
        type: "checkbox",
        id: "app_antiRecommendationLoop",
        text: "Anti Recommendation Loop",
        storeField: $store.settings.antiRecommendationLoop,
    },
    {
        type: "button",
        onClick: () => {
            fetchVQL("api seeLogs! s._id=1");
        },
        text: "See Logs"
    },
    {
        type: "button",
        text: "Clear Cache",
        onClick: async () => {
            const confirm = await uiFunc.confirm("Are you sure you want to clear cache?");
            if (!confirm) return;
            fetchVQL("api -clearQuickCache s._id=1");
        }
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