import { existsSync } from "fs";
import puppeteer from "puppeteer";

const regexVi = /\/vi\/([^/]+)/;
const regexUrl = /https?:\/\/[^\s"']+/g;

let browserType = process.env.BROWSER as any;
if (!browserType) {
    browserType = await findChromeExecutable();
}
if (!browserType) {
    browserType = await findFirefoxExecutable();
}
if (!browserType) {
    browserType = "chrome";
}
console.log("Using browser:", browserType);

export async function getRecomended(id: string) {
    const browser = await puppeteer.launch({
        headless: true,
        browser: browserType,
    });
    const page = await browser.newPage();

    await page.goto(`https://www.youtube.com/watch?v=${id}`, { waitUntil: "networkidle2" });

    await new Promise(resolve => setTimeout(resolve, 100));

    const html = await page.content();
    await browser.close();

    const linksRaw = [...new Set(html.match(regexUrl))];
    const videos = linksRaw.filter(l => l.includes("i.ytimg.com/vi"));

    const ids = videos.map(v => {
        const match = v.match(regexVi);
        return match ? match[1] : null;
    }).filter(Boolean).filter(i => i !== id);

    const idsUnique = [...new Set(ids)];

    return idsUnique;
}

async function findChromeExecutable() {
    const paths = {
        win32: [
            process.env.LOCALAPPDATA + '\\Google\\Update\\ClientStateMedium\\{8A69D345-D564-463C-AFF1-A69D9E530F96}\\main.exe',
            process.env.PROGRAMFILES + '\\Google\\Chrome\\Application\\chrome.exe',
            process.env['PROGRAMFILES(X86)'] + '\\Google\\Chrome\\Application\\chrome.exe'
        ],
        darwin: [
            '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
            '/Applications/Chromium.app/Contents/MacOS/Chromium'
        ],
        linux: [
            '/usr/bin/google-chrome',
            '/usr/bin/chromium',
            '/usr/bin/chromium-browser'
        ]
    }[process.platform];

    for (const path of paths) {
        if (existsSync(path)) return path;
    }

    return null;
}

async function findFirefoxExecutable() {
    const paths = {
        win32: [
            process.env.PROGRAMFILES + '\\Mozilla Firefox\\firefox.exe',
            process.env['PROGRAMFILES(X86)'] + '\\Mozilla Firefox\\firefox.exe'
        ],
        darwin: [
            '/Applications/Firefox.app/Contents/MacOS/firefox'
        ],
        linux: [
            '/usr/bin/firefox',
            '/usr/local/bin/firefox'
        ]
    }[process.platform];

    for (const path of paths) {
        if (existsSync(path)) return path;
    }

    return null;
}