import { XMLParser } from "fast-xml-parser";
import { fetchVQL } from "./vql";
import ky from "ky";
import db from "./db";

const parser = new XMLParser();
const baseUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=";

interface FeedItem {
    title: string;
    pubDate: string;
    author: string;
    authorId: string;
    id: string;
}

export async function getFeed(channelId: string) {
    if (!channelId) return null;
    const dataXML = await ky.get(baseUrl + channelId).text();
    const data = parser.parse(dataXML);

    return data.feed.entry.map((item: any) => {
        const feedEntry: FeedItem = {
            title: item.title,
            pubDate: item.published,
            author: item.author.name,
            id: item.id.replace("yt:video:", ""),
            authorId: channelId
        }
        return feedEntry;
    }) as FeedItem[];
}

export async function getQuickFeed() {
    const channels = await db.user.find<{ _id: string }>("subs", {}).then(res => res.map(c => c._id));
    const feeds = await Promise.all(channels.map(c => getFeed(c)));
    return feeds.flat();
}