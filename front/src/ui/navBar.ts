import { fetchVQL } from "#api/index";
import { $store } from "#store";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { changeView } from ".";
import { uiMsg } from "./modal/message";
import { loadVideo } from "./video/player/status";
import { clearQueryParams } from "#utils";
import "./nav.scss";

interface StackItem {
    view: string;
    search: string;
}

class NavBarView implements UiComponent {
    element: HTMLDivElement;
    undoBtn: HTMLButtonElement;
    redoBtn: HTMLButtonElement;

    stack: StackItem[] = [];
    redoStack: StackItem[] = [];

    mount() {
        this.element = document.querySelector("#nav-bar");
        this.undoBtn = this.element.querySelector("#undo")!;
        this.redoBtn = this.element.querySelector("#redo")!;

        this.undoBtn.onclick = () => this.undo();
        this.redoBtn.onclick = () => this.redo();

        const VoidTube = this.element.querySelector("a");
        VoidTube.addEventListener("click", (e) => {
            e.preventDefault();
            clearQueryParams();
        });
        VoidTube.addEventListener("contextmenu", (e) => {
            e.preventDefault();
            fetchVQL("api self-version! s.id=0").then(({ version }) => {
                uiMsg(`Version: ${version}`);
            });
        });
    }

    undo() {
        if (this.stack.length <= 1) return;
        const itemActual = this.stack.pop()!;
        const item = this.stack[this.stack.length - 1];
        this.redoStack.push(itemActual);

        window.history.replaceState(null, "", item.search.trim() || window.location.pathname);
        changeView(item.view);
        extraActions(item);
    }

    save(view: string) {
        const last = this.stack[this.stack.length - 1];
        const search = window.location.search;
        if (last && last.view === view && last.search === search) return;

        this.stack.push({ view, search });
        this.redoStack = [];
    }

    redo() {
        if (this.redoStack.length === 0) return;
        const item = this.redoStack.pop()!;
        this.stack.push(item);

        window.history.replaceState(null, "", item.search.trim() || window.location.pathname);
        changeView(item.view);
        extraActions(item);    
    }
}

function extraActions(item: StackItem) {
    if (item.view === "video") {
        const v = new URLSearchParams(item.search).get("v");
        if ($store.videoId.get() === v) return;
        loadVideo(v, { saveNav: false });
    }
}

const navBarView = new NavBarView();
export default navBarView;