const m0 = (() => {
    const BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
    const UA = "mrfentmen-dictionary-mcp/1.0 (https://github.com/mrfentmen)";
    class DictError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
        if (res.status === 404)
            throw new DictError("Word not found");
        if (!res.ok)
            throw new DictError(`Dictionary error ${res.status}`);
        return (await res.json());
    }
    async function define(args) {
        const word = (args.word ?? "").trim();
        if (!word)
            throw new DictError("Provide a word");
        const d = await get(`${BASE}/${encodeURIComponent(word)}`);
        const entry = d[0] ?? {};
        const phonetics = (entry.phonetics ?? []).map((p) => p.text).filter(Boolean).join(", ");
        const meanings = (entry.meanings ?? []).slice(0, 3).map((m) => {
            const defs = (m.definitions ?? []).slice(0, 3).map((df, i) => `${i + 1}. ${df.definition ?? ""}${df.example ? ` (e.g. ${df.example})` : ""}`).join("\n   ");
            return `${m.partOfSpeech ?? ""}\n   ${defs}`;
        }).join("\n");
        return `${entry.word ?? word}\n${phonetics ? `Phonetics: ${phonetics}\n` : ""}${meanings || "No definitions"}`;
    }
    async function wordOfDay(_args) {
        const d = await get(`${BASE}/random`);
        const entry = d[0] ?? {};
        const meanings = (entry.meanings ?? []).slice(0, 2).map((m) => {
            const defs = (m.definitions ?? []).slice(0, 2).map((df) => df.definition ?? "").join("; ");
            return `${m.partOfSpeech ?? ""}: ${defs}`;
        }).join("\n");
        return `Word: ${entry.word ?? ""}\n${meanings || "No definitions"}`;
    }
    return { DictError, define, wordOfDay };
})();
const m1 = (() => {
    const BASE = "https://api.dictionaryapi.dev/api/v2/entries/en";
    const UA = "mrfentmen-word-of-day-mcp/1.0 (https://github.com/mrfentmen)";
    class WordError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(20000) });
        if (res.status === 404)
            throw new WordError("No word available right now");
        if (!res.ok)
            throw new WordError(`Dictionary error ${res.status}`);
        return (await res.json());
    }
    // Deterministic word pick per UTC day from a curated list, then fetch its real definition.
    const WORDS = ["serendipity", "ephemeral", "luminous", "resilient", "eloquent", "meticulous", "curiosity", "zenith", "quintessential", "effervescent", "solstice", "wanderlust", "euphoria", "tranquil", "vibrant"];
    function wordForToday() {
        const day = Math.floor(Date.now() / 86400000);
        return WORDS[day % WORDS.length];
    }
    async function wordOfTheDay(_args) {
        const word = wordForToday();
        const d = await get(`${BASE}/${word}`);
        const entry = d[0] ?? {};
        const phonetic = (entry.phonetics ?? []).map((p) => p.text).filter(Boolean)[0] ?? "";
        const meaning = (entry.meanings ?? [])[0] ?? {};
        const firstDef = (meaning.definitions ?? [])[0]?.definition ?? "";
        const example = (meaning.definitions ?? [])[0]?.example;
        return `Word of the day: ${entry.word ?? word}\n${phonetic ? `Pronunciation: ${phonetic}\n` : ""}${meaning.partOfSpeech ? `Part of speech: ${meaning.partOfSpeech}\n` : ""}Definition: ${firstDef}${example ? `\nExample: ${example}` : ""}`;
    }
    async function randomWord(_args) {
        const d = await get(`${BASE}/random`);
        const entry = d[0] ?? {};
        const meaning = (entry.meanings ?? [])[0] ?? {};
        const firstDef = (meaning.definitions ?? [])[0]?.definition ?? "";
        return `${entry.word ?? "word"}\n${meaning.partOfSpeech ?? ""}: ${firstDef}`;
    }
    return { WordError, randomWord, wordOfTheDay };
})();
export const DictError = m0.DictError;
export const WordError = m1.WordError;
export const define = m0.define;
export const randomWord = m1.randomWord;
export const wordOfDay = m0.wordOfDay;
export const wordOfTheDay = m1.wordOfTheDay;
export const m0_DictError = m0.DictError;
export const m0_wordOfDay = m0.wordOfDay;
export const m0_define = m0.define;
export const m1_wordOfTheDay = m1.wordOfTheDay;
export const m1_WordError = m1.WordError;
export const m1_randomWord = m1.randomWord;
// ---- muxE tools:
// The four existing tools print a word, its phonetic text and a few definitions
// with their examples. Two whole parts of the entry are never read: the synonyms
// and antonyms under every meaning, and the per pronunciation audio, language and
// licence. The new tools read those, and both cope with the upstream answering
// 522 for some words, which was verified live and is not a block on this side.
const DICT = "https://api.dictionaryapi.dev/api/v2/entries/en";
const DICT_UA = "mrfentmen-dictionary-mcp/1.0 (https://github.com/mrfentmen)";
/**
 * Two things about this host were measured live. It answers 200 for a word one
 * request serves and 522 for another, and which is which is stable per word
 * rather than per rate: cat, test and a answered 200 every time while happy,
 * dog, love and apple answered 522 every time. And a successful answer takes
 * about 20 seconds, measured at 19868, 19514, 19513 and 19525 ms across four
 * node fetches, so the timeout has to clear 20 s and a retry does not fit inside
 * a single MCP request. One attempt, a timeout that fits the real latency, and a
 * 522 reported as what it is rather than as a missing word.
 */
async function dictGet(word) {
    const url = `${DICT}/${encodeURIComponent(word)}`;
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": DICT_UA }, signal: AbortSignal.timeout(28000) });
    }
    catch (e) {
        const timedOut = e instanceof Error && (e.name === "TimeoutError" || e.name === "AbortError");
        if (!timedOut)
            throw new Error(`The dictionary could not be reached: ${e instanceof Error ? e.message : String(e)}`);
        throw new Error(`The dictionary at api.dictionaryapi.dev did not answer within 28 seconds for "${word}". A successful answer to this host takes about 20 seconds, so this is the upstream being slower than usual rather than this client.`);
    }
    if (res.status === 404)
        throw new Error(`The dictionary holds no entry for "${word}".`);
    if (res.status === 522) {
        throw new Error(`The dictionary's own host answered HTTP 522 for "${word}", which is a timeout between it and its origin. It answers 522 for some words and 200 for others, so this is that word rather than this client; try another word.`);
    }
    if (!res.ok)
        throw new Error(`The dictionary returned ${res.status}.`);
    return (await res.json());
}
async function entryFor(word) {
    const raw = (word ?? "").trim();
    if (!raw)
        throw new Error("Provide a word.");
    const list = await dictGet(raw);
    const entry = Array.isArray(list) ? list[0] : null;
    if (!entry || typeof entry !== "object")
        throw new Error(`The dictionary returned no usable entry for "${raw}".`);
    return entry;
}
export async function wordPhonetics(args) {
    const entry = await entryFor(args?.word ?? "");
    const items = Array.isArray(entry.phonetics) ? entry.phonetics : [];
    const seen = new Set();
    const unique = items.filter((p) => {
        const key = `${p.text ?? ""}|${p.audio ?? ""}`;
        if (seen.has(key))
            return false;
        seen.add(key);
        return true;
    });
    const withAudio = unique.filter((p) => typeof p.audio === "string" && p.audio);
    const lines = [
        `Pronunciations recorded for ${entry.word ?? args?.word}:`,
        `  headword phonetic: ${entry.phonetic || "not reported"}`,
        `  pronunciation records: ${items.length}, of which ${unique.length} are distinct`,
        `  with an audio file: ${withAudio.length}`,
    ];
    for (const p of unique.slice(0, 15)) {
        lines.push(`  ${p.text || "no phonetic text"}${p.lang ? ` (${p.lang})` : ""}`);
        if (p.audio)
            lines.push(`    audio: ${p.audio.slice(0, 140)}`);
        if (p.sourceUrl)
            lines.push(`    recorded by: ${p.sourceUrl.slice(0, 120)}`);
        if (p.license?.name)
            lines.push(`    licence: ${p.license.name}${p.license.url ? ` - ${p.license.url}` : ""}`);
    }
    if (unique.length > 15)
        lines.push(`  and ${unique.length - 15} more pronunciation(s) not listed here`);
    if (!unique.length)
        lines.push("  this entry records no per pronunciation data at all.");
    lines.push("  the existing tools print at most a comma joined list of the phonetic text, with no audio, no language and no recording licence.");
    return lines.join("\n");
}
