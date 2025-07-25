import db from "#db";
import { XMLParser } from "fast-xml-parser";
import ky from "ky";
import { FeedItem } from "./types";

const parser = new XMLParser();
const baseUrl = "https://www.youtube.com/feeds/videos.xml?channel_id=";

export async function getFeed(channelId: string): Promise<FeedItem[] | null> {
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
    })
}

export async function getQuickFeed(): Promise<FeedItem[]> {
    const channels = await db.user.find<{ _id: string }>("subs", {}).then(res => res.map(c => c._id));
    const feeds = await Promise.all(channels.map(c => getFeed(c)));
    return feeds.flat().filter(Boolean) as FeedItem[];
}