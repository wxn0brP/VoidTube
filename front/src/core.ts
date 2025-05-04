globalThis.lo = console.log;
globalThis.delay = (ms: number): Promise<void> => new Promise(res => setTimeout(res, ms));

declare global {
    interface HTMLElement {
        html(v?: string): string | HTMLElement;
        on(event: string, fn: EventListenerOrEventListenerObject): void;
        css(style: string | Record<string, string>, val?: string | null): void;
        attrib(att: string, arg?: string | null): string | HTMLElement;
        clA(arg: string): HTMLElement;
        clR(arg: string): HTMLElement;
        clT(className: string): HTMLElement;
        animateFade(from: number, options?: { time?: number; cb?: () => void }): HTMLElement;
        fadeIn(display?: string | (() => void), cb?: () => void): HTMLElement;
        fadeOut(cb?: () => void): HTMLElement;
        fadeToggle(): HTMLElement;
        add(child: HTMLElement): HTMLElement;
        addUp(child: HTMLElement): HTMLElement;
        fade: boolean;
    }

    interface HTMLInputElement {
        v(v?: string): string | HTMLInputElement;
    }

    var lo: typeof console.log;
    var delay: (ms: number) => Promise<void>;
}

export const cw = {
    proto: {
        html(this: HTMLElement, v?: string): string | HTMLElement {
            if (v !== undefined) {
                this.innerHTML = v;
                return this;
            } else {
                return this.innerHTML;
            }
        },

        v(this: HTMLInputElement, v?: string): string | HTMLInputElement {
            if (v !== undefined) {
                this.value = v;
                return this;
            } else {
                return this.value;
            }
        },

        on(this: HTMLElement, event: string, fn: EventListenerOrEventListenerObject): void {
            this.addEventListener(event, fn);
        },

        css(this: HTMLElement, style: string | Record<string, string>, val: string | null = null): void {
            if (typeof style === "string") {
                if (val !== null) {
                    this.style[style as any] = val;
                } else {
                    (this.style as any).cssText = style;
                }
            } else {
                Object.assign(this.style, style);
            }
        },

        attrib(this: HTMLElement, att: string, arg: string | null = null): string | HTMLElement {
            if (arg !== null) {
                this.setAttribute(att, arg);
                return this;
            } else {
                return this.getAttribute(att) || "";
            }
        },

        clA(this: HTMLElement, arg: string): HTMLElement {
            this.classList.add(arg);
            return this;
        },

        clR(this: HTMLElement, arg: string): HTMLElement {
            this.classList.remove(arg);
            return this;
        },

        clT(this: HTMLElement, className: string): HTMLElement {
            this.classList.toggle(className);
            return this;
        },

        animateFade(this: HTMLElement, from: number, options: { time?: number; cb?: () => void } = {}): HTMLElement {
            const { time = 200, cb } = options;
            const style = this.style;
            const steps = 50;
            const timeToStep = time / steps;
            const d = (from === 0 ? 1 : -1) / steps;
            let index = 0;
            style.opacity = from.toString();

            const interval = setInterval(() => {
                if (index >= steps) {
                    clearInterval(interval);
                    cb?.();
                    return;
                }
                style.opacity = (parseFloat(style.opacity || "0") + d).toString();
                index++;
            }, timeToStep);
            return this;
        },

        fadeIn(this: HTMLElement, display: string | (() => void) = "block", cb?: () => void): HTMLElement {
            if (typeof display === "function") {
                cb = display;
                display = "block";
            }

            this.css("display", display);
            this.animateFade(0, { cb });
            (this as any).fade = true;
            return this;
        },

        fadeOut(this: HTMLElement, cb?: () => void): HTMLElement {
            this.animateFade(1, { time: 300, cb });
            setTimeout(() => this.css("display", "none"), 300);
            (this as any).fade = false;
            return this;
        },

        fadeToggle(this: HTMLElement): HTMLElement {
            if ((this as any).fade) {
                this.fadeOut();
            } else {
                this.fadeIn();
            }
            return this;
        },

        add(this: HTMLElement, child: HTMLElement): HTMLElement {
            this.appendChild(child);
            return this;
        },

        addUp(this: HTMLElement, child: HTMLElement): HTMLElement {
            this.insertBefore(child, this.firstChild);
            return this;
        },

        fade: true,
    },

    init(): void {
        Object.assign(HTMLElement.prototype, this.proto);
    },

    rand(min: number, max: number): number {
        return Math.round(Math.random() * (max - min) + min);
    },

    round(a: number, b: number): number {
        const factor = Math.pow(10, b);
        return Math.round(a * factor) / factor;
    },

    get(url: string): string{
        if (!url) return "";
        const xhr = new XMLHttpRequest();
        xhr.open("GET", url, false);
        xhr.send();

        if (xhr.status === 200) {
            return xhr.responseText;
        } else if (xhr.status === 404) {
            return "";
        } else {
            return "";
        }
    },
};

cw.init();
export default cw;