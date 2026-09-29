import { $store } from "#store";
import playerView from ".";
import { uiMsg } from "#ui/modal/message";

let timerId: ReturnType<typeof setTimeout> = null;
let countdownId: ReturnType<typeof setInterval> = null;

function clearTimers() {
	if (timerId) {
		clearTimeout(timerId);
		timerId = null;
	}
	if (countdownId) {
		clearInterval(countdownId);
		countdownId = null;
	}
	$store.player.sleepTimerEndsAt.set(0);
}

function formatRemaining(ms: number) {
	const totalSec = Math.max(0, Math.ceil(ms / 1000));
	const m = Math.floor(totalSec / 60);
	const s = totalSec % 60;
	return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function startSleepTimer(minutes: number) {
	clearTimers();
	if (!minutes || minutes <= 0) return;
	const ms = minutes * 60_000;
	const endsAt = Date.now() + ms;
	$store.player.sleepTimerEndsAt.set(endsAt);
	uiMsg(`Sleep timer: ${minutes} min`);

	timerId = setTimeout(() => {
		clearTimers();
		if (playerView.mediaSync.isPlaying) {
			playerView.mediaSync.pause();
			uiMsg("Sleep timer expired - paused");
		}
	}, ms);

	countdownId = setInterval(() => {
		const remaining = $store.player.sleepTimerEndsAt.get() - Date.now();
		$store.player.sleepTimerEndsAt.set(Date.now() + remaining);
		if (remaining <= 0) clearTimers();
	}, 30_000);
}

export function cancelSleepTimer() {
	if ($store.player.sleepTimerEndsAt.get() === 0) return;
	clearTimers();
	uiMsg("Sleep timer cancelled");
}

export function toggleSleepTimer() {
	if ($store.player.sleepTimerEndsAt.get() > 0) {
		cancelSleepTimer();
	} else {
		const remaining = $store.player.sleepTimerEndsAt.get() - Date.now();
		if (remaining > 0)
			uiMsg(`Sleep timer: ${formatRemaining(remaining)} remaining`);
	}
}

export function getSleepRemaining() {
	const endsAt = $store.player.sleepTimerEndsAt.get();
	if (!endsAt) return 0;
	return Math.max(0, endsAt - Date.now());
}
