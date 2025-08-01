import { UiMessage__opts, UiMsg__opts } from "#types/message";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { delay } from "@wxn0brp/flanker-ui/utils";
import "./message.scss";

export async function uiMessage(message: string, opts: UiMessage__opts = {}) {
    opts = {
        displayTime: 6000,
        ...opts,
    }
    const div = document.createElement("div");
    div.innerHTML = message;

    div.style.top = `-${div.offsetHeight + 20}px`;
    if (opts.className) div.classList.add(opts.className);
    if (opts.backgroundColor) div.style.backgroundColor = opts.backgroundColor;

    const padding = 10;
    let topPosition = calculateTopPosition();

    function calculateTopPosition() {
        let top = 0;
        for (const child of messageView.element.children)
            top += (child as HTMLDivElement).offsetHeight + padding;
        return top;
    }

    let ended = false;

    async function end() {
        ended = true;
        div.style.top = `-${div.offsetHeight + 20}px`;

        await delay(700);
        for (const child of messageView.element.children) {
            const childE = child as HTMLDivElement;
            const currentTop = parseInt(childE.style.top.replace("px", ""));
            childE.style.top = `${currentTop - padding - div.offsetHeight}px`;
        }
        div.remove();
    }

    div.addEventListener("click", end);
    if (opts.onClick) div.addEventListener("click", opts.onClick);

    messageView.element.appendChild(div);
    await delay(100);
    div.style.top = `${10 + topPosition}px`;

    await delay(opts.displayTime - 700);
    if (ended) return;
    await end();
}

export function uiMsg(data: string, opts: UiMsg__opts = {}) {
    console.log("[UiMsg]", data);

    opts = {
        extraTime: 0,
        ...opts
    }

    const speed = 1 / 3; //1s = 3 words
    const time = data.split(" ").length * speed + 6 + opts.extraTime;

    const msgOpts: UiMessage__opts = {
        displayTime: time * 1000,
        className: "uiMsgClass",
    }
    if (opts.onClick) msgOpts.onClick = opts.onClick;

    uiMessage(data, msgOpts);
}

class MessageView implements UiComponent {
    element: HTMLDivElement;

    mount() {
        this.element = qs("#err")!;
    }
}

const messageView = new MessageView();
export default messageView;