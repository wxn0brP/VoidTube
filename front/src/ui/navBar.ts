import { fetchVQL } from "#api/index";
import { UiComponent } from "@wxn0brp/flanker-ui";
import { changeView } from ".";
import { uiMsg } from "./modal/message";

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

        this.element.querySelector("b").addEventListener("contextmenu", (e) => {
            e.preventDefault();
            fetchVQL("api self-version! s.id=0").then(({ version }) => {
                uiMsg(`Version: ${version}`);
            });
        })
    }

    undo() {
        if (this.stack.length <= 1) return;
        const itemActual = this.stack.pop()!;
        const item = this.stack[this.stack.length - 1];
        this.redoStack.push(itemActual);

        window.history.replaceState(null, "", item.search.trim() || window.location.pathname);
        changeView(item.view);
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
    }
}

const navBarView = new NavBarView();
export default navBarView;