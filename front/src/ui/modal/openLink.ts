import { mgl } from "#mgl";
import uiFunc from ".";

export async function openLinkPopUp(url: string) {
    const urlParts = url.split("/");
    if (urlParts.length < 2) return console.error("Invalid URL");
    const urlColored = `${urlParts[0]}//<span style="color: red">${urlParts[2]}</span>/${urlParts.slice(3).join("/")}`;

    const confirm = await uiFunc.confirm(`Do you want open this link?<br/>${urlColored}`);
    if (!confirm) return;

    const link = document.createElement("a");
    link.href = url;
    link.target = "_blank";
    link.click();
}

mgl.openLink = openLinkPopUp;