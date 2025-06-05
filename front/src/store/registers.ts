import { fetchVQL } from "#api/index";
import { $store } from "#store";
import utils from "@wxn0brp/flanker-ui";

const cancel = utils.throttle(() => fetchVQL("api -video-load s.id=0"), 1000);
$store.loader.subscribe(count => {
    if (count > 30) cancel();
});