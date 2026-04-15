import { seeLogs } from "#echo/logger";
import { getCaps, getChannelVideos, getPlaylistIds, getPlaylistInfo, searchVideo } from "#relay/apiBack";
import { getFeed, getQuickFeed } from "#relay/feed";
import { clearQuickCache } from "#relay/fetchQuick";
import { getRecommended } from "#relay/getRecommended";
import { getSuggestions } from "#relay/suggestions";
import { AdapterBuilder } from "@wxn0brp/vql/helpers/apiAbstract";
import { runFeedVQL } from "./alg";
import "./cache";
import { channelInfo } from "./logic/channel";
import { downloadVideo } from "./logic/download";
import { fetchQuickCache, fetchQuickCache$ } from "./logic/quick";
import { apiExecutor, retrieveVideoData, retrieveVideoData$ } from "./logic/vidInfo";

const adapter = new AdapterBuilder();

adapter.add("download", async ({ data }) => downloadVideo(data as any));

adapter.find("playlistIds", async ({ search }: any) => getPlaylistIds(search.url || search._id));
adapter.find("recommendations", async ({ search }: any) => getRecommended(search.url || search._id, search.limit || 10));
adapter.find("video-static", async ({ search }: any) => retrieveVideoData$(search));
adapter.find("channelVideos", async ({ search }: any) => getChannelVideos(search.url || search._id, search.flat ?? true));
adapter.find("channelFeed", async ({ search }: any) => getFeed(search.url || search._id));
adapter.find("quickFeed", async () => getQuickFeed());
adapter.find("video-static-quick", async ({ search }: any) => fetchQuickCache$(search));
adapter.find("suggestions", async ({ search }: any) => getSuggestions(search.q || search.query, search.hl || "en", search.gl || "US"));
adapter.find("playlist", async ({ search }: any) => getPlaylistInfo(search.url || search._id));

adapter.findOne("video", async ({ search }: any) => retrieveVideoData(search.url || search._id));
adapter.findOne("video-static", async ({ search }: any) => retrieveVideoData(search.url || search._id, false));
adapter.findOne("search", async ({ search }: any) => searchVideo(search.q || search.query, search.size || 10));
adapter.findOne("self-version", async () => ({ version: process.env.VOIDTUBE_VERSION || "unknown" }));
adapter.findOne("channelInfo", async ({ search }: any) => channelInfo(search.url || search._id || search.id, search.update || false));
adapter.findOne("algRun", async () => runFeedVQL());
adapter.findOne("seeLogs", async () => seeLogs());
adapter.findOne("video-static-quick", async ({ search }: any) => fetchQuickCache(search._id || search.id));
adapter.findOne("caps", async ({ search }: any) => getCaps(search.url || search._id));

adapter.removeOne("video-load", async ({ search }: any) => apiExecutor.cancel(search.id || search._id || search.url));

adapter.remove("video-load", async () => apiExecutor.cancelLevel(0));
adapter.remove("clearQuickCache", async () => await clearQuickCache());

export const YouTubeAdapter = adapter.getAdapter(true);
