export const promptDiv = document.querySelector<HTMLDivElement>("#prompt");
import "./openLink";

const uiFunc = {
    prompt(text: string, defaultValue: string = ""): Promise<string> {
        return new Promise((resolve) => {
            function end() {
                resolve(input.value);
                div.fadeOut();
                setTimeout(() => {
                    div.remove();
                }, 2000);
            }

            const div = document.createElement("div");
            div.style.opacity = "0";
            div.classList.add("prompt");
            div.innerHTML = "<p>" + text + "<p><br />";

            const input = document.createElement("input");
            input.type = "text";
            input.value = defaultValue;
            input.addEventListener("keydown", (e) => {
                if (e.key == "Enter") end();
            })
            div.appendChild(input);
            setTimeout(() => {
                input.focus();
            }, 100);

            div.appendChild(document.createElement("br"));

            const btn = document.createElement("button");
            btn.innerHTML = "OK";
            div.appendChild(btn);
            btn.addEventListener("click", end);

            promptDiv.appendChild(div);
            div.fadeIn();
        });
    },

    confirm(text: string, yesText: string="OK", noText: string="Cancel"): Promise<boolean> {
        return new Promise((resolve) => {
            function end(accept: boolean) {
                return () => {
                    resolve(accept);
                    div.fadeOut();
                    setTimeout(() => {
                        div.remove();
                    }, 2000);
                }
            }

            const div = document.createElement("div");
            div.style.opacity = "0";
            div.classList.add("prompt");
            div.innerHTML = "<p>" + text + "<p><br />";

            const flex = document.createElement("div");
            flex.style.display = "flex";
            flex.style.justifyContent = "space-evenly";

            const reject = document.createElement("button");
            reject.innerHTML = noText || "Cancel";
            reject.addEventListener("click", end(false));
            flex.appendChild(reject);

            const accept = document.createElement("button");
            accept.innerHTML = yesText || "OK";
            accept.addEventListener("click", end(true));
            flex.appendChild(accept);

            div.appendChild(flex);
            promptDiv.appendChild(div);
            div.fadeIn();
        });
    },

    selectPrompt<T>(text: string, options, optionsValues = [], categories: { name: string; options: T[], value?: T }[] = []): Promise<string | T> {
        return new Promise((resolve) => {
            function end() {
                resolve(select.value);
                div.fadeOut();
                setTimeout(() => {
                    div.remove();
                }, 2000);
            }

            const div = document.createElement("div");
            div.style.opacity = "0";
            div.classList.add("prompt");
            div.innerHTML = "<p>" + text + "<p><br />";
            const select = document.createElement("select");
            for (let i = 0; i < categories.length; i++) {
                const category = categories[i];
                const selectElement = document.createElement("optgroup");
                selectElement.label = category.name;
                for (let j = 0; j < category.options.length; j++) {
                    const optionElement = document.createElement("option");
                    optionElement.value = category.options[j] as string || category.options[j] as string;
                    optionElement.innerHTML = category.options[j] as string;
                    selectElement.appendChild(optionElement);
                }
                select.appendChild(selectElement);
            }
            for (let i = 0; i < options.length; i++) {
                const optionElement = document.createElement("option");
                optionElement.value = optionsValues[i] || options[i];
                optionElement.innerHTML = options[i];
                select.appendChild(optionElement);
            }
            select.querySelector("option").selected = true;

            div.appendChild(select);
            div.appendChild(document.createElement("br"));

            const btn = document.createElement("button");
            btn.innerHTML = "OK";
            div.appendChild(btn);
            btn.addEventListener("click", end);

            promptDiv.appendChild(div);
            div.fadeIn();
        });
    },

    promptTime(
        text: string,
        inputType: "time" | "date" | "datetime" | "datetime-local" = "datetime-local",
        min?: number,
        max?: number
    ): Promise<string> {
        return new Promise((resolve) => {
            function end() {
                resolve(input.value);
                div.fadeOut();
                setTimeout(() => {
                    div.remove();
                }, 2000);
            }

            const div = document.createElement("div");
            div.style.opacity = "0";
            div.classList.add("prompt");
            div.innerHTML = "<p>" + text + "<p><br />";

            const input = document.createElement("input");
            input.type = inputType;
            input.value = "00:00";
            if (min) input.min = new Date(min).toISOString();
            if (max) input.max = new Date(max).toISOString();

            input.addEventListener("keydown", (e) => {
                if (e.key == "Enter") end();
            })
            div.appendChild(input);
            setTimeout(() => {
                input.focus();
            }, 100);

            div.appendChild(document.createElement("br"));

            const btn = document.createElement("button");
            btn.innerHTML = "OK";
            div.appendChild(btn);
            btn.addEventListener("click", end);

            promptDiv.appendChild(div);
            div.fadeIn();
        });
    }
}

export default uiFunc;