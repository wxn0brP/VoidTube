import { $store } from "#store";
import { SponsorSegment } from "#types/sponsorBlock";
import { uiMsg } from "#ui/modal/message";
import playerView from ".";

export async function sponsorBlock() {
    if (!$store.settings.sponsorBlock.get()) return;
    const segments = $store.sponsorBlock.segments.get();
    if (!segments || !segments.length) return;
    const current = playerView.mediaSync.currentTime;

    for (const seg of segments) {
        const [start, end] = seg.segment;
        const condition =
            $store.settings.sponsorBlock.full.get() ?
                current >= start && current < end :
                current >= start && current < start + 2;

        if (condition) {
            uiMsg(`Skipping via sponsor block (${seg.category})`);
            playerView.mediaSync.seek(end);
            break;
        }
    }
}

export async function fetchSponsorSegments(videoId: string) {
    const url = `https://sponsor.ajay.app/api/skipSegments?videoID=${videoId}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("Failed to fetch SponsorBlock segments");
    const data: SponsorSegment[] = await res.json();
    return data;
}