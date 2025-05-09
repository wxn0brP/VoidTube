import { mgl } from "./mgl";

export function debounce(func: Function, timeout: number = 300) {
    let timer: NodeJS.Timeout;
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    }
}
export function throttle(fn: Function, delay = 5000) {
    let lastCall = 0;

    return function (this: any, ...args: any[]) {
        const now = Date.now();
        if (now - lastCall >= delay) {
            fn.apply(this, args);
            lastCall = now;
        }
    };
}

export function updateQueryParam(key: string, value: string | undefined): void {
    const url = new URL(window.location.href);

    if (value === undefined) {
        url.searchParams.delete(key);
    } else {
        url.searchParams.set(key, value);
    }

    window.history.replaceState({}, '', url.toString());
}

export function clearQueryParams(): void {
    window.history.replaceState({}, '', window.location.origin);
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

export function fewItems(element: HTMLElement, lenght: number) {
    element.classList.toggle("fewItems", length > 0 && lenght <= 3);
}