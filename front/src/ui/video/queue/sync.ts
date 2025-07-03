import { mgl } from "#mgl";
import { generateName } from "#utils/names";
import { delay } from "@wxn0brp/flanker-ui/utils";
import queuePanel from ".";
import { append, appendToNext, clear, remove } from "./queue";
import { render } from "./render";
import { $store } from "#store";

const channel = new BroadcastChannel("queue");
export const queuesMesh = new Map<string, string>();
joinGroup();
getQueuesMesh();

type ChannelMessage = { payload: { _gId: string } } & (ChannelMessage_Id | ChannelMessage_Post);

interface ChannelMessage_Id {
    type: "add" | "remove" | "clear" | "get" | "addNext" | "identify-rq" | "identify-rs";
    payload: {
        id: string;
    };
}

interface ChannelMessage_Post {
    type: "post";
    payload: {
        q: string[];
    }
}

channel.addEventListener("message", (event: MessageEvent<ChannelMessage>) => {
    console.log("[Queue]", event.data);
    if (event.data.type === "identify-rq") {
        emitQueueMessage("identify-rs", { id: queuePanel.queue[0] });
        return;
    }
    if (event.data.type === "identify-rs") {
        queuesMesh.set(event.data.payload._gId, event.data.payload.id);
        return;
    }

    if (event.data?.payload?._gId !== $store.queueGroup.get()) return;

    if (event.data.type === "add") {
        append(queuePanel, event.data.payload.id, true);
    } else if (event.data.type === "addNext") {
        appendToNext(queuePanel, event.data.payload.id, true);
    } else if (event.data.type === "remove") {
        remove(queuePanel, event.data.payload.id, true);
    } else if (event.data.type === "clear") {
        clear(queuePanel, false, true);
    } else if (event.data.type === "get") {
        emitQueue();
    } else if (event.data.type === "post") {
        queuePanel.queue = event.data.payload.q;
        render(queuePanel);
    }
});

export function emitQueueMessage(type: string, payload: any = {}) {
    console.log("[Queue]", type, payload);
    channel.postMessage({
        type,
        payload: {
            _gId: $store.queueGroup.get(),
            ...payload
        }
    });
}

export function joinGroup(id: string = generateName()) {
    if (!id) return;
    $store.queueGroup.set(id);
    emitQueueMessage("get");
    document.querySelector("#queues-exit-name").textContent = id;
}

function emitQueue() {
    emitQueueMessage("post", {
        q: queuePanel.queue
    });
}

export async function getQueuesMesh() {
    queuesMesh.clear();
    emitQueueMessage("identify-rq");
    await delay(100); // wait for response
    return queuesMesh;
}

mgl.qs = {
    joinGroup,
    emit: emitQueueMessage
}
