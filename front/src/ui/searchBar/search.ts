import { searchVideo } from "#api/video";
import { loadVideo } from "#ui/video/player/status";
import playListSnapView from "#ui/view/playListSnap";
import searchView from "#ui/view/search";
import { getYouTubeVideoId, updateQueryParam, clearQueryParams, setTitle } from "#utils";
import { SearchBarView } from ".";
import { hideSuggestions } from "./suggestion";
import { saveSearchHistory } from "./utils";

export async function search(cmp: SearchBarView) {
    const titleOrUrl = cmp.searchInput.value.trim();
    if (!titleOrUrl) return;
    hideSuggestions(cmp);

    if (titleOrUrl.startsWith("https://")) {
        const url = new URL(titleOrUrl);
        const playlist = url.searchParams.get("list");
        if (playlist) {
            playListSnapView.loadYoutubePlaylist(playlist).then(playListSnapView.show);
        } else {
            const id = getYouTubeVideoId(titleOrUrl);
            updateQueryParam("v", id);
            loadVideo(id);
        }
        return;
    }

    clearQueryParams();
    updateQueryParam("query", titleOrUrl);
    setTitle(titleOrUrl);

    const size = Number(cmp.searchSizeInput.value) || 10;
    const searchResults = await searchVideo(titleOrUrl, size);
    searchView.show();
    searchView.render(searchResults);
    saveSearchHistory(cmp, titleOrUrl);

    const index = cmp.searchHistory.indexOf(titleOrUrl);
    if (index >= 0)
        cmp.searchHistory.splice(index, 1);
    cmp.searchHistory.unshift(titleOrUrl);
}