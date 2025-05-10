import ky from "ky";

const regexVi = /\/vi\/([^/]+)/;
const regexUrl = /https?:\/\/[^\s"']+/g;

export async function getRecomended(id: string) {
    const html = await ky.get<string>(`https://www.youtube.com/watch?v=${id}`).text();

    const linksRaw = [...new Set(html.match(regexUrl))];
    const videos = linksRaw.filter(l => l.includes("i.ytimg.com/vi"));

    const ids = videos.map(v => {
        const match = v.match(regexVi);
        return match ? match[1] : null;
    }).filter(Boolean).filter(i => i !== id);

    const idsUnique = [...new Set(ids)];

    return idsUnique;
}