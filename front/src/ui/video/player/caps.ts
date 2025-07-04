import { $store } from "#store";
import { uiMsg } from "#ui/modal/message";
import { fetchVQL } from "@wxn0brp/vql-client";
import playerView from ".";

interface Link {
    ext: string,
    url: string,
    name: string
}

interface ReturnData {
    [lang: string]: Link[];
}

const cache: { id: string, data: ReturnData | null } = {
    id: "",
    data: null
}

export async function getData(id: string) {
    if (!id) return;
    if (cache.id == id) return cache.data;
    const data = await fetchVQL<ReturnData>(`api caps! s._id = ${id}`);
    cache.data = data;
    cache.id = id;
    return data;
}

export async function loadCaps(lang = "en") {
    removeCaps();

    const id = $store.videoId.get();
    if (!id) return;
    const data: ReturnData = await getData(id); 
    
    const link: Link = data[lang]?.find((e: any) => e.ext == "json3");
    if (!link) return uiMsg("No subtitles found");
    
    const json3 = await fetch(link.url).then(res => res.json());

    const trackElement = document.createElement("track");
    trackElement.dataset.id = "track";
    trackElement.kind = "subtitles";
    trackElement.label = link.name || "English";
    trackElement.srclang = lang;
    
    playerView.videoEl.appendChild(trackElement);

    const track = trackElement.track;
    if (!track) {
        console.error("Could not get text track from element.");
        return;
    }
    track.mode = "showing";

    for (const ev of json3.events) {
        if (!ev.segs) continue;
        const text = ev.segs.map((seg: any) => seg.utf8).join("").trim();
        if (!text) continue;

        const start = ev.tStartMs / 1000;
        const end = (ev.tStartMs + (ev.dDurationMs || 2000)) / 1000;

        try {
            const cue = new VTTCue(start, end, text);
            cue.line = "auto";
            cue.position = 50;
            cue.align = "center";

            track.addCue(cue);
        } catch (e) {
            console.warn("Cue rejected:", e, { start, end, text });
        }
    }
}

export function removeCaps() {
    const track = playerView.videoEl.qi<HTMLTrackElement>("track");
    if (!track) return;
    track.track.mode = "hidden";
    setTimeout(() => track.remove(), 100);
}

export function setUpCaps(select: HTMLSelectElement) {
    select.addEventListener("change", async () => {
        const value = select.value;
        if (value === "none") return removeCaps();
        else if (value === "Load") {
            const data = await getData($store.videoId.get());
            renderOptions(select, data);
            return;
        }

        removeCaps();
        loadCaps(value);
    });

    renderOptions(select);
    $store.videoId.subscribe(() => {
        renderOptions(select);
        cache.data = null;
        cache.id = "";
    });
}

function renderOptions(select: HTMLSelectElement, data?: ReturnData) {
    select.innerHTML = "";
    const none = document.createElement("option");
    none.value = "none";
    none.innerText = "None";
    select.appendChild(none);

    if (data) {
        const options = Object.keys(data);
        for (let i = 0; i < options.length; i++) {
            const option = document.createElement("option");
            option.value = options[i];
            option.innerText = data[options[i]]?.[0]?.name || options[i];
            select.appendChild(option);
        }
    } else {
        const load = document.createElement("option");
        load.value = "Load";
        load.innerText = "Load";
        select.appendChild(load);
    }
}