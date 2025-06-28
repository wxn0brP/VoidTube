export function setDescription(el: HTMLDialogElement, text: string) {
    if (!text || text.trim().length === 0) return el.innerHTML = "No description";

    const times = parseAndReplaceTimes(text);
    text = times.text;

    text = text
        .replace(/(https?:\/\/[^\s]+)/g, url => `<a href="javascript:void(0)" onclick="mgl.openLink('${url}')">${url}</a>`)
        .replace(/#\s*([^\s#]+)/g, (match, hash) =>
            `<a href="/?query=${encodeURIComponent(hash).trim().replaceAll(" ", "+")}" onclick="mgl.searchShow('${hash}', event)">${match}</a>`
        )
        .replace(/\>/g, "&gt;") // replace > with &gt; (security)

    el.innerHTML = text.replace(/\n/g, "<br />");
}

export interface TimeEntry {
    time: string;
    title: string | null;
}

function parseAndReplaceTimes(text: string): { text: string; entries: TimeEntry[] } {
    const lines = text.split("\n");
    let currentTitle: string | null = null;
    const entries: TimeEntry[] = [];

    const processedLines = lines.map(line => {
        const textLine = line.trim();

        if (/^text\s+[a-zA-Z0-9]$/.test(textLine)) {
            currentTitle = textLine;
            return line;
        }

        const match = textLine.match(/^(\d{1,2}:\d{2}:\d{2}|\d{1,2}:\d{2})(?:\s+(.+))?/);

        if (match) {
            const fullTime = match[1];
            const title = match[2] || null;

            entries.push({ time: fullTime, title });

            const displayTitle = title ? title : fullTime;
            const seconds = fullTime.split(":").reduce((acc, val) => acc * 60 + Number(val), 0);
            const link = `<a href="javascript:void(0)" onclick="mgl.player.setTime(${seconds})">${fullTime}</a> ${displayTitle}`;

            return line.replace(match[0], link);
        }

        return line;
    });

    return {
        text: processedLines.join("\n"),
        entries,
    };
}