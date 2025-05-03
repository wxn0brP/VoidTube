// import ytDlp from "yt-dlp-exec";
// import { writeFileSync } from "fs";

// export async function urlToData (url: string) {
//     const videoInfo = await ytDlp(url, {
//         dumpSingleJson: true,
//     });
    
//     const out = parseMediaUrls(videoInfo);
//     writeFileSync("data.json", JSON.stringify(out));

//     return Object.assign({ success: true }, out);
// }

// export function filterFormats(formats, type: "audio" | "video") {
//     return formats.filter(format => {
//         if (type === "audio") {
//             return format.acodec !== "none" && format.vcodec === "none";
//         } else if (type === "video") {
//             return format.vcodec !== "none";
//         }
//         return false;
//     });
// }

// export function parseMediaUrls(parsedData, unsupportedFormats = ["m3u8"]) {
//     // Pobierz wszystkie formaty z danych
//     const formats = parsedData.formats || [];

//     // Filtruj formaty audio i wideo
//     const audioFormats = filterFormats(formats, "audio");
//     const videoFormats = filterFormats(formats, "video");

//     function checkUnsupportedFormats(format: { url: string, ext: string }) {
//         return (
//             unsupportedFormats.includes(format.ext) ||
//             unsupportedFormats.some(unf => format.url.includes(unf))
//         )
//     }

//     const allAudioUrls = audioFormats.map(format => {
//         if (checkUnsupportedFormats(format)) return null;
//         return {
//             url: format.url,
//             tbr: format.tbr,
//             ext: format.ext
//         };
//     }).filter(Boolean);
//     const allVideoUrls = videoFormats.map(format => {
//         if (checkUnsupportedFormats(format)) return null;
//         return {
//             url: format.url,
//             height: format.height,
//             ext: format.ext
//         };
//     }).filter(Boolean);

//     // Znajdź najlepsze jakościowo audio i wideo
//     const bestAudio = allAudioUrls.reduce((best, current) => {
//         return (current.tbr > (best?.tbr || 0)) ? current : best;
//     }, null);

//     const bestVideo = allVideoUrls.reduce((best, current) => {
//         return (current.height > (best?.height || 0)) ? current : best;
//     }, null);

//     // Zwróć URL-e
//     return {
//         allVideoUrls,
//         allAudioUrls,
//         audioUrl: bestAudio?.url || null,
//         videoUrl: bestVideo?.url || null,
//     };
// }