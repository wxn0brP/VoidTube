import { note } from "#echo/logger";
import { wrapper } from "./wrapper";
import { YoutubeDlOptions, VideoInfo, SearchResult, PlaylistInfo, ChannelInfo, ChannelVideo, YoutubeDlResult } from "./types";

const options: YoutubeDlOptions = {
    dumpSingleJson: true,
    noCheckCertificates: true,
    noWarnings: true,
}

export async function getVideoInfo(videoUrl: string, withFormats: boolean = false): Promise<VideoInfo> {
    try {
        if (
            typeof videoUrl !== "string" ||
            videoUrl.trim() === "" ||
            videoUrl === "null" ||
            videoUrl === "undefined"
        ) throw new Error("Unknown video");
        if (
            !videoUrl.startsWith("https://www.youtube.com/watch?v=") && !videoUrl.startsWith("https://youtu.be/")
        ) {
            videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`;
        }

        note("scraper", "getVideoInfo", videoUrl, withFormats);

        const opts: YoutubeDlOptions = Object.assign({}, options, {
            preferFreeFormats: true,
            skipDownload: true,
            noCheckFormats: !withFormats,
        });

        const result = await wrapper<YoutubeDlResult>(videoUrl, opts);

        const baseInfo: VideoInfo = {
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
                resolution: format.resolution ?? `${format.width}x${format.height}`,
                ext: format.ext,
                fps: format.fps,
                fileSize: format.filesize,
                is_video: format.vcodec !== "none",
                is_audio: format.acodec !== "none",
            }));

        return {
            ...baseInfo,
            formats,
        };
    } catch (error) {
        console.error("Error while getting video info:", error.message);
        throw error;
    }
}

export async function searchVideo(title: string, size: number): Promise<SearchResult[]> {
    try {
        if (title === "undefined") throw new Error("Unknown video");
        note("scraper", "searchVideo", title);

        const opts: YoutubeDlOptions = Object.assign({}, options, {
            flatPlaylist: true,
        })
        const result = await wrapper<YoutubeDlResult>(`ytsearch${size}:"${title}"`, opts);
        return result.entries.map(entry => ({
            title: entry.title,
            id: entry.id,
            thumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            duration: entry.duration,
            views: entry.view_count,
            channel: entry.channel_id,
            channelName: entry.channel || entry.uploader
        }));
    } catch (error) {
        console.error("Error while searching video:", error.message);
        throw error;
    }
}

export async function getPlaylistIds(playlist: string): Promise<string[]> {
    try {
        if (playlist === "undefined") throw new Error("Unknown playlist");
        if (!playlist.startsWith("https://www.youtube.com/playlist?list=")) {
            playlist = `https://www.youtube.com/playlist?list=${playlist}`;
        }
        note("scraper", "getPlaylistIds", playlist);

        const opts: YoutubeDlOptions = Object.assign({}, options, {
            flatPlaylist: true,
        })
        const result = await wrapper<YoutubeDlResult>(playlist, opts);
        return result.entries.map(entry => entry.id);
    } catch (error) {
        console.error("Error while getting playlist ids:", error.message);
        throw error;
    }
}

export async function download(url: string, format: string, dir: string): Promise<void> {
    try {
        if (url === "undefined") throw new Error("Unknown video");
        if (
            !url.startsWith("https://www.youtube.com/watch?v=") && !url.startsWith("https://youtu.be/")
        ) {
            url = `https://www.youtube.com/watch?v=${url}`;
        }

        note("scraper", "download", url);

        const outputTemplate = dir + "/%(title)s.%(ext)s";

        const opts: string[] = [
            '--output', "'" + outputTemplate + "'",
        ]
        if (format == "mp3") {
            opts.push("--extract-audio");
            opts.push("--audio-format", "mp3");
            opts.push("--audio-quality", "256K");
        } else {
            opts.push("--format", "bestvideo[ext=mp4]+bestaudio[ext=m4a]/mp4");
        }

        await wrapper<string>(url, {
            embedThumbnail: true,
            addMetadata: true,
        }, opts);
    } catch (error) {
        console.error("Error while downloading video:", error.message);
        throw error;
    }
}

export async function getChannelInfo(channelUrl: string): Promise<ChannelInfo> {
    try {
        if (channelUrl === "undefined") throw new Error("Unknown channel");
        if (channelUrl.startsWith("@")) {
            channelUrl = `https://www.youtube.com/${channelUrl}`;
        }
        if (!channelUrl.startsWith("https://www.youtube.com/")) {
            channelUrl = `https://www.youtube.com/channel/${channelUrl}`;
        }

        note("scraper", "getChnlInfo", channelUrl);

        const opts: YoutubeDlOptions = Object.assign({}, options, { flatPlaylist: true, });

        const result = await wrapper<YoutubeDlResult>(channelUrl + "/about", opts);

        const avatar = result.thumbnails.find(t => t.id == "avatar_uncropped")?.url || result.thumbnails[result.thumbnails.length - 1]?.url;
        const banner = result.thumbnails.find(t => t.id == "banner_uncropped")?.url;
        return {
            short_id: result.id,
            id: result.channel_id,
            name: result.title || result.name,
            description: result.description,
            avatar,
            banner,
            subscribers: result.channel_subscribers_count || result.channel_follower_count,
        };
    } catch (error) {
        console.error("Error while fetching channel info:", error.message);
        throw error;
    }
}

export async function getPlaylistInfo(playlistUrl: string): Promise<PlaylistInfo[]> {
    try {
        const opts: YoutubeDlOptions = Object.assign({}, options, { flatPlaylist: true, });

        if (!playlistUrl.startsWith("https://www.youtube.com/playlist?list=")) {
            playlistUrl = `https://www.youtube.com/playlist?list=${playlistUrl}`;
        }

        note("scraper", "getPlaylistInfo", playlistUrl);

        const result = await wrapper<YoutubeDlResult>(playlistUrl, opts);
        return result.entries.map(entry => ({
            id: entry.id,
            title: entry.title,
            url: entry.url,
            channel: entry.channel_id,
            channelName: entry.channel || entry.uploader,
            thumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            duration: entry.duration,
            views: entry.view_count
        }));
    } catch (error) {
        console.error("Error while fetching playlist info:", error.message);
        throw error;
    }
}

export async function getChannelVideos(channelUrl: string, flat: boolean = true): Promise<ChannelVideo[]> {
    try {
        if (channelUrl === "undefined") throw new Error("Unknown channel");
        const opts: YoutubeDlOptions = Object.assign({}, options, { flatPlaylist: flat, });

        if (!channelUrl.startsWith("https://www.youtube.com/")) {
            channelUrl = `https://www.youtube.com/channel/${channelUrl}`;
        }

        note("scraper", "getChnlVid", channelUrl);

        const result = await wrapper<YoutubeDlResult>(channelUrl + "/videos", opts);

        return result.entries.map(entry => ({
            title: entry.title,
            id: entry.id,
            thumbnail: entry.thumbnails[entry.thumbnails.length - 1].url,
            duration: entry.duration,
            views: entry.view_count,
        }));
    } catch (error) {
        console.error("Error while fetching channel videos:", error.message);
        throw error;
    }
}

export async function getCaps(videoUrl: string): Promise<any> {
    try {
        if (videoUrl === "undefined") throw new Error("Unknown video");
        if (
            !videoUrl.startsWith("https://www.youtube.com/watch?v=") && !videoUrl.startsWith("https://youtu.be/")
        ) {
            videoUrl = `https://www.youtube.com/watch?v=${videoUrl}`;
        }

        const opts: YoutubeDlOptions = Object.assign({}, options, { flatPlaylist: true, });

        note("scraper", "getCaps", videoUrl);

        const result = await wrapper<YoutubeDlResult>(videoUrl, opts);

        return result.automatic_captions || {};
    } catch (error) {
        console.error('Error while fetching channel videos:', error.message);
        throw error;
    }
}