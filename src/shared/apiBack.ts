import { writeFileSync } from "fs";
import { wrapper } from "./wrapper";

const options = {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
}

export async function getVideoInfo(videoUrl: string, withFormats: boolean = false) {
    try {
        if (videoUrl === "undefined") throw new Error("Unknown video");
        if (
            !videoUrl.startsWith("https://www.youtube.com/watch?v=") && !videoUrl.startsWith("https://youtu.be/")
        ) {
            videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`;
        }

        const opts = Object.assign({}, options, {
            preferFreeFormats: true,
            youtubeSkipDashManifest: true,
            skipDownload: true,
            noCheckFormats: !withFormats,
        });

        const result = await wrapper(videoUrl, opts);

        const baseInfo = {
            title: result.title,
            description: result.description,
            thumbnail: result.thumbnail,
            duration: result.duration,
            uploadDate: result.upload_date,
            views: result.view_count,
            likes: result.like_count,
            channel: result.channel_id,
        };

        if (!withFormats) return baseInfo;

        const formats = (result.formats || [])
            .filter(format => format.url && !format.url.includes("ytimg.com"))
            .filter(format => !format.url.includes("m3u8"))
            .map(format => ({
                url: format.url,
                formatId: format.format_id,
                resolution: format.resolution ?? `${format.width}x${format.height}` ?? null,
                ext: format.ext,
                fps: format.fps,
                fileSize: format.filesize,
                is_video: format.vcodec !== 'none',
                is_audio: format.acodec !== 'none',
            }));

        return {
            ...baseInfo,
            formats,
        };
    } catch (error) {
        console.error("Error while getting video info:", error);
        throw error;
    }
}

export async function searchVideo(title: string, size: number) {
    try {
        if (title === "undefined") throw new Error("Unknown video");
        const opts = Object.assign({}, options, {
            flatPlaylist: true,
        })
        const result = await wrapper(`ytsearch${size}:"${title}"`, opts) as any;
        return result.entries.map(entry => ({
            title: entry.title,
            id: entry.id,
            thumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            duration: entry.duration,
            views: entry.view_count,
            channel: entry.channel_id,
        }));
    } catch (error) {
        console.error("Error while searching video:", error);
        throw error;
    }
}

export async function getPlaylistIds(playlist: string) {
    try {
        if (playlist === "undefined") throw new Error("Unknown playlist");
        if (!playlist.startsWith("https://www.youtube.com/playlist?list=")) {
            playlist = `https://www.youtube.com/playlist?list=${playlist}`;
        }

        const opts = Object.assign({}, options, {
            flatPlaylist: true,
        })
        const result = await wrapper(playlist, opts) as any;
        return result.entries.map(entry => entry.id);
    } catch (error) {
        console.error("Error while getting playlist ids:", error);
        throw error;
    }
}

export async function download(url: string, format: string, dir: string) {
    try {
        if (url === "undefined") throw new Error("Unknown video");
        if (
            !url.startsWith("https://www.youtube.com/watch?v=") && !url.startsWith("https://youtu.be/")
        ) {
            url = `https://www.youtube.com/watch?v=${url}`;
        }

        const outputTemplate = dir + '/%(title)s.%(ext)s';

        const opts: string[] = [
            '--output', "'" + outputTemplate + "'",
        ]
        if (format == "mp3") {
            opts.push('--extract-audio');
            opts.push('--audio-format', 'mp3');
            opts.push('--audio-quality', '256K');
        } else {
            opts.push('--format', "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4");
        }

        await wrapper<string>(url, {
            embedThumbnail: true,
            addMetadata: true,
        }, opts);
    } catch (error) {
        console.error("Error while downloading video:", error);
        throw error;
    }
}

export async function getChannelInfo(channelUrl: string) {
    try {
        if (channelUrl === "undefined") throw new Error("Unknown channel");
        if (channelUrl.startsWith("@")) {
            channelUrl = `https://www.youtube.com/${channelUrl}`;
        }
        if (!channelUrl.startsWith("https://www.youtube.com/")) {
            channelUrl = `https://www.youtube.com/channel/${channelUrl}`;
        }

        const opts = Object.assign({}, options, { flatPlaylist: true, });

        const result = await wrapper(channelUrl + "/about", opts);
        return {
            short_id: result.id,
            id: result.channel_id,
            name: result.title,
            description: result.description,
            thumbnails: result.thumbnails,
            // @ts-ignore
            subscribers: result.channel_subscribers_count || result.channel_follower_count,

        };
    } catch (error) {
        console.error('Error while fetching channel info:', error);
        throw error;
    }
}

// export async function getPlaylistInfo(playlistUrl: string) {
//     try {
//         const opts = Object.assign({}, options, { flatPlaylist: true, });

//         if (!playlistUrl.startsWith("https://www.youtube.com/playlist?list=")) {
//             playlistUrl = `https://www.youtube.com/playlist?list=${playlistUrl}`;
//         }

//         const result = await wrapper(playlistUrl, opts);
//         // @ts-ignore
//         console.log(result.entries);
//         // @ts-ignore
//         return result.entries.map(entry => ({
//             title: entry.title,
//             url: entry.url,
//             thumbnail: entry.thumbnail,
//             duration: entry.duration,
//         }));
//     } catch (error) {
//         console.error('Error while fetching playlist info:', error);
//         throw error;
//     }
// }

export async function getChannelVideos(channelUrl: string) {
    try {
        if (channelUrl === "undefined") throw new Error("Unknown channel");
        const opts = Object.assign({}, options, { flatPlaylist: true, });

        if (!channelUrl.startsWith("https://www.youtube.com/")) {
            channelUrl = `https://www.youtube.com/channel/${channelUrl}`;
        }

        const result = await wrapper(channelUrl + "/videos", opts);

        // @ts-ignore
        return result.entries.map(entry => ({
            title: entry.title,
            id: entry.id,
            thumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            duration: entry.duration,
            views: entry.view_count,
        }));
    } catch (error) {
        console.error('Error while fetching channel videos:', error);
        throw error;
    }
}