import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { throttle } from "#utils";

const cancel = throttle(() => fetchVQL("api -video-load s.id=0"), 1000);
$store.loader.subscribe(count => {
    if (count > 30) cancel();
});