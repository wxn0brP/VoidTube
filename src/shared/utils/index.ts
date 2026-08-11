export function getTTL() {
	const now = Math.floor(Date.now() / 1000);
	return now + 3600 * 5; // 5 hours
}
