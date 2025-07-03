import { mgl } from "../mgl";

export function updateQueryParam(key: string, value: string | undefined): void {
    const url = new URL(window.location.href);

    if (value === undefined) {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }

    window.history.pushState({}, '', url.toString());
}

export function clearQueryParams(): void {
    window.history.pushState({}, '', window.location.origin);
}
mgl.clearQueryParams = clearQueryParams;

export function formatTime(time: number, hasHours: boolean | null = true): string {
    if (isNaN(time)) return (hasHours ? "00:" : "") + "00:00";
    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);
    if (hasHours === null) hasHours = hours > 0;
    const timeString =
        (hasHours ? (hours < 10 ? "0" : "") + hours.toString() + ":" : "") +
        (minutes < 10 ? "0" : "") + minutes.toString() + ":" +
        (seconds < 10 ? "0" : "") + seconds.toString();
    return timeString;
}

export function getYouTubeVideoId(url: string): string | null {
    if (!url.includes(".")) return url;
    const urlObj = new URL(url);

    if (urlObj.hostname === "youtu.be") {
        return urlObj.pathname.slice(1);
    }

    if (urlObj.hostname === "www.youtube.com" || urlObj.hostname === "youtube.com") {
        if (urlObj.searchParams.has("v")) {
            return urlObj.searchParams.get("v");
        }
    }

    return null;
}

export function levenshtein(a: string, b: string): number {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    const dp = Array(b.length + 1).fill(0).map((_, i) => i);
    for (let i = 1; i <= a.length; i++) {
        let prev = i;
        for (let j = 1; j <= b.length; j++) {
            const temp = dp[j];
            dp[j] = Math.min(
                dp[j] + 1,
                prev + (a[i - 1] === b[j - 1] ? 0 : 1),
                dp[j - 1] + 1
            );
            prev = temp;
        }
    }
    return dp[b.length];
}

export const clamp = (min: number, num: number, max: number) => Math.min(Math.max(num, min), max);

export function setTitle(title: string) {
    const baseTitle = "Void Tube";
    if (title && title.trim() !== "") title = " | " + title;
    document.title = baseTitle + (title || "");
}

export function fewItems(element: HTMLElement, length: number) {
    element.classList.toggle("fewItems", length > 0 && length <= 3);
}

export function numToLocale(num: number) {
    return (num || 0).toLocaleString();
}

export function getThumbnail(data: string, id: string) {
    if (!id) return "/favicon.svg";
    if (data === "/favicon.svg") return "/favicon.svg";
    if (!data) return "https://i.ytimg.com/vi/" + id + "/maxresdefault.jpg";
    if (data.startsWith("http")) return data;
    return "https://i.ytimg.com/vi/" + id + "/" + data + ".jpg";
}

export const number2HumanFormatter = new Intl.NumberFormat(undefined, {
    notation: "compact",
    compactDisplay: "short",
    maximumFractionDigits: 1,
});
