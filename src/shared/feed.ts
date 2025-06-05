import Parser from "rss-parser";
import VQL, { fetchVQL } from "./vql";

const parser = new Parser();
const baseUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=";

interface FeedItem {
    title: string;
    link: string;
    pubDate: string;
    author: string;
    id: string;
    isoDate: string;
    channelId: string;
}

export async function getFeed(channelId: string) {
    if (!channelId) return null;
    const url = baseUrl + channelId;
    const feed = await parser.parseURL(url);
    feed.items.forEach(item => {
        item.id = item.id.replace("yt:video:", "");
        item.channelId = channelId;
    });
    return feed.items as FeedItem[];
}

export async function getQuickFeed() {
    const channels = await fetchVQL<{ _id: string }[]>("user subs").then(res => res.map(c => c._id));
    const feeds = await Promise.all(channels.map(c => getFeed(c)));
    return feeds.flat();
}