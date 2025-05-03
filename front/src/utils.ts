export function debounce(func: Function, timeout: number = 300) {
    let timer: NodeJS.Timeout;
    return (...args: any) => {
        clearTimeout(timer);
        timer = setTimeout(() => { func.apply(this, args); }, timeout);
    }
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

export function formatTime(time: number, hasHours: boolean | null = true): string {
    if (isNaN(time)) return "00:00:00";
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