const adjectives1 = [
    "good", "new", "first", "last", "long", "great", "own", "other",
    "old", "right", "big", "high", "different", "small", "large"
];

const adjectives2 = [
    "important", "necessary", "possible", "popular", "common",
    "natural", "similar", "serious", "clear", "final", "main",
    "close", "free", "easy", "available"
];

const nouns = [
    "time", "year", "people", "way", "day", "thing",
    "life", "world", "school", "work", "home", "car",
    "city", "country", "problem", "program", "question"
];

export function generateName(): string {
    const adj1 = adjectives1[Math.floor(Math.random() * adjectives1.length)];
    const adj2 = adjectives2[Math.floor(Math.random() * adjectives2.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];

    return `${adj1}_${adj2}_${noun}_${Math.floor(100 + Math.random() * 900)}`;
}