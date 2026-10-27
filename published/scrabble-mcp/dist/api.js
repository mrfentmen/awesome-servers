const UA = "mrfentmen-scrabble-mcp/1.0";
export class ScrabbleError extends Error {
}
const VALUES = {
    a: 1, e: 1, i: 1, o: 1, u: 1, l: 1, n: 1, s: 1, t: 1, r: 1,
    d: 2, g: 2,
    b: 3, c: 3, m: 3, p: 3,
    f: 4, h: 4, v: 4, w: 4, y: 4,
    k: 5,
    j: 8, x: 8,
    q: 10, z: 10,
};
export async function wordScore(args) {
    const word = (args.word ?? "").trim().toLowerCase();
    if (!word)
        throw new ScrabbleError("Provide a word to score");
    if (!/^[a-z]+$/.test(word))
        throw new ScrabbleError("Only letters are allowed");
    const breakdown = word.split("").map((c) => `${c}:${VALUES[c] ?? 0}`).join(" ");
    const total = word.split("").reduce((sum, c) => sum + (VALUES[c] ?? 0), 0);
    const bingo = word.length === 7 ? "\n7 letters: +50 bingo bonus" : "";
    return `"${word}"\n${breakdown}\nBase score: ${total}${bingo}\nTotal: ${total + (word.length === 7 ? 50 : 0)}`;
}
// ---- muxA tools:
// The existing tool scores a word of letters and nothing else. These score a
// word that may use blank tiles, written as ? _ or *, and check a word against
// the real tile distribution rather than only adding its letters up. Both are
// pure computation on the local tables below.
/** How many of each letter a standard English set holds. */
const DISTRIBUTION = {
    a: 9, b: 2, c: 2, d: 4, e: 12, f: 2, g: 3, h: 2, i: 9, j: 1, k: 1, l: 4, m: 2,
    n: 6, o: 8, p: 2, q: 1, r: 6, s: 4, t: 6, u: 4, v: 2, w: 2, x: 1, y: 2, z: 1,
};
const BLANKS = 2;
/** The characters that stand for a blank tile, worth nothing but usable as any letter. */
const BLANK_MARKERS = "?_*";
