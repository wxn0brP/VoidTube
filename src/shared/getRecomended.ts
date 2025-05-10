import { BrowserWindow } from "electron";

const regexVi = /\/vi\/([^/]+)/;
const regexUrl = /https?:\/\/[^\s"']+/g;

export async function getRecomended(id: string) {
    const html: string = await dumpPageHTML(`https://www.youtube.com/watch?v=${id}`);

    const linksRaw = [...new Set(html.match(regexUrl))];
    const videos = linksRaw.filter(l => l.includes("i.ytimg.com/vi"));

    const ids = videos.map(v => {
        const match = v.match(regexVi);
        return match ? match[1] : null;
    }).filter(Boolean).filter(i => i !== id);

    const idsUnique = [...new Set(ids)];

    return idsUnique;
}

async function dumpPageHTML(url: string) {
    const win = new BrowserWindow({
        show: false,
        webPreferences: {
            offscreen: true,
            contextIsolation: true,
        }
    });

    win.webContents.setAudioMuted(true);
    await win.loadURL(url, { userAgent: 'Mozilla/5.0' });
    win.webContents.setAudioMuted(true);

    await new Promise(res => setTimeout(res, 1000));

    const html = await win.webContents.executeJavaScript("document.documentElement.outerHTML");
    return html;
}