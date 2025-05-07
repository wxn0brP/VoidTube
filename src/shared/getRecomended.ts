import puppeteer from "puppeteer";

const regexVi = /\/vi\/([^/]+)/;
const regexUrl = /https?:\/\/[^\s"']+/g;

export async function getRecomended(id: string) {
    const browser = await puppeteer.launch({ headless: true });
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
