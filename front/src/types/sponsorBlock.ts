export type SponsorCategory =
    | "sponsor"
    | "intro"
    | "outro"
    | "interaction"
    | "selfpromo"
    | "music_offtopic"
    | "preview"
    | "filler";

export interface SponsorSegment {
    segment: [number, number];
    category: SponsorCategory;
    actionType: "skip" | "poi" | "full";
    UUID: string;
    videoID: string;
    userID: string;
    timeSubmitted: number;
    views: number;
    votes: number;
}
