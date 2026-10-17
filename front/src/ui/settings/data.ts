import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { Setting } from "#types/setting";
import uiFunc from "#ui/modal";
import { uiMsg } from "#ui/modal/message";

export const settingsData: Setting[] = [
	{
		type: "select",
		text: "Quality",
		names: [
			"Best quality",
			"1080p",
			"720p",
			"480p",
			"360p",
			"240p",
			"144p",
		],
		values: [
			"best",
			"1080",
			"720",
			"480",
			"360",
			"240",
			"144",
		],
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
		type: "checkbox",
		id: "app_audioFade",
		text: "Audio Fade Enabled",
		storeField: $store.settings.audioFadeEnabled,
	},
	{
		type: "input",
		id: "app_audioFadeTime",
		text: "Audio Fade Time",
		storeField: $store.settings.audioFade,
		input_type: "number",
		min: 0,
		max: 3_000,
	},
	{
		type: "select",
		id: "app_speed",
		text: "Playback Speed",
		names: [
			"0.25x",
			"0.5x",
			"0.75x",
			"1x",
			"1.25x",
			"1.5x",
			"1.75x",
			"2x",
		],
		values: [
			"0.25",
			"0.5",
			"0.75",
			"1",
			"1.25",
			"1.5",
			"1.75",
			"2",
		],
		storeField: $store.player.speed,
	},
	{
		type: "button",
		onClick: () => {
			fetchVQL("api seeLogs! s._id=1");
		},
		text: "See Logs",
	},
	{
		type: "button",
		text: "Clear Cache",
		onClick: async () => {
			const confirm = await uiFunc.confirm(
				"Are you sure you want to clear cache?",
			);
			if (!confirm) return;
			fetchVQL("api -clearQuickCache s._id=1");
		},
	},
	{
		type: "separator",
	},
	{
		type: "header",
		text: "Data",
	},
	{
		type: "button",
		text: "Export backup",
		onClick: exportBackup,
	},
	{
		type: "button",
		text: "Import backup",
		onClick: importBackupDialog,
	},
	{
		type: "separator",
	},
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
		storeField: $store.settings.alg.minHistory,
	},
	{
		type: "input",
		id: "alg_maxKeywords",
		text: "Max Keywords",
		input_type: "number",
		min: 1,
		max: 9999,
		storeField: $store.settings.alg.maxKeywords,
	},
	{
		type: "input",
		id: "alg_keywordMinFreq",
		text: "Keyword Minimum Frequency",
		input_type: "number",
		min: 1,
		max: 9999,
		storeField: $store.settings.alg.keywordMinFreq,
	},
	{
		type: "input",
		id: "alg_videoPerTag",
		text: "Count of Videos Per Tag",
		input_type: "number",
		min: 1,
		max: 9999,
		storeField: $store.settings.alg.videoPerTag,
	},
	{
		type: "input",
		id: "alg_noisePercent",
		text: "Noise Percentage",
		input_type: "number",
		min: 0,
		max: 100,
		storeField: $store.settings.alg.noisePercent,
	},
	{
		type: "input",
		id: "alg_noiseBoost",
		text: "Noise Boost",
		input_type: "number",
		min: 1,
		max: 9999,
		storeField: $store.settings.alg.noiseBoost,
	},
	{
		type: "input",
		id: "alg_hashTagBoost",
		text: "Hash Tag Weight",
		input_type: "number",
		min: 0,
		max: 9999,
		storeField: $store.settings.alg.hashTagBoost,
	},
	{
		type: "input",
		id: "alg_minScore",
		text: "Video Minimum Score",
		input_type: "number",
		min: 0,
		max: 9999,
		storeField: $store.settings.alg.minScore,
	},
	{
		type: "textarea",
		id: "alg_irrelevant",
		text: "Irrelevant Tags",
		placeholder: "New line separated",
		width: 15,
		height: 5,
		saveButton: {
			onClick: async value => {
				const val = value
					.split("\n")
					.map(v => v.trim())
					.filter(v => v.length > 0)
					.join(",");
				await fetchVQL(
					`user updateOneOrAdd settings s._id=alg_irrelevant u.v=${val}`,
				);
				uiMsg("Saved");
			},
		},
	},
];

export async function exportBackup() {
	try {
		const res = await fetch("/api/backup");
		if (!res.ok) return uiMsg("Backup export failed");
		const data = await res.json();
		const blob = new Blob(
			[
				JSON.stringify(data, null, 2),
			],
			{
				type: "application/json",
			},
		);
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = `voidtube-backup-${new Date().toISOString().slice(0, 10)}.json`;
		link.click();
		URL.revokeObjectURL(url);
		uiMsg("Backup exported");
	} catch (err) {
		uiMsg(`Backup export failed: ${err.message}`);
	}
}

export function importBackupDialog() {
	const input = document.createElement("input");
	input.type = "file";
	input.accept = "application/json";
	input.onchange = async () => {
		const file = input.files?.[0];
		if (!file) return;

		const sure = await uiFunc.confirm(
			"Import backup? This overwrites current local data",
		);
		if (!sure) return;

		try {
			const payload = JSON.parse(await file.text());
			const res = await fetch("/api/backup", {
				method: "POST",
				headers: {
					"Content-Type": "application/json",
				},
				body: JSON.stringify(payload),
			});
			const result = await res.json();
			if (!res.ok) return uiMsg(`Import failed: ${result.error || res.status}`);
			uiMsg(`Imported ${result.imported} documents`);
		} catch (err) {
			uiMsg(`Import failed: ${err.message}`);
		}
	};
	input.click();
}
