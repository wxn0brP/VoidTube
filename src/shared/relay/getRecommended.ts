import ky from "ky";

const regexVi = /\/vi\/([^/]+)/;
const regexUrl = /https?:\/\/[^\s"']+/g;

export async function getRecommended(id: string, limit: number = 10): Promise<string[]> {
    const html = await ky.get<string>(`https://www.youtube.com/watch?v=${id}`).text();

    const linksRaw = [...new Set(html.match(regexUrl))];
    const videos = linksRaw.filter(l => l.includes("i.ytimg.com/vi"));

    const ids = videos.map(v => {
        const match = v.match(regexVi);
        return match ? match[1] : null;
    }).filter(Boolean).filter(i => i !== id) as string[];

    const idsUnique = [...new Set(ids)];

    return idsUnique.slice(0, limit);
}