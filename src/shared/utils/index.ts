export function getTTL() {
    const now = Math.floor(new Date().getTime() / 1000);
    return now + (3600 * 5); // 5 hours
}
