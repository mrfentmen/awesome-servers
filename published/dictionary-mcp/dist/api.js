/**
 * Free Dictionary — keyless public API client.
 */
const BASE = "https://api.dictionaryapi.dev";
const SOURCE = "Free Dictionary";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "dictionary-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
function entries(d, word) {
    const rows = Array.isArray(d) ? d : [];
    if (!rows.length)
        throw new SourceError(`the dictionary has no entry for "${word}"`);
    return rows;
}
function phonetic(row) {
    const listed = Array.isArray(row?.phonetics) ? row.phonetics : [];
    const withAudio = listed.find((p) => p?.audio);
    const text = clean(row?.phonetic) || clean(listed.find((p) => p?.text)?.text);
    return [text, withAudio?.audio ? `audio ${clean(withAudio.audio)}` : "", withAudio?.sourceUrl ? `source ${clean(withAudio.sourceUrl)}` : ""]
        .filter(Boolean).join(" · ");
}
function sameOrigin(url) {
    return clean(url);
}
export async function define(a) {
    const word = clean(a.word).toLowerCase();
    if (!/^[a-z][a-z'-]{0,44}$/.test(word))
        throw new SourceError("word must be letters, apostrophes or dashes");
    const per = a.definitionsPerSense ?? 3;
    if (!Number.isInteger(per) || per < 1 || per > 6)
        throw new SourceError("definitionsPerSense must be between 1 and 6");
    const d = await getJson(`/api/v2/entries/en/${encodeURIComponent(word)}`);
    const rows = entries(d, word);
    const blocks = [`${clean(rows[0].word)}${phonetic(rows[0]) ? ` - ${phonetic(rows[0])}` : ""}`];
    for (const row of rows) {
        for (const meaning of row.meanings ?? []) {
            const defs = Array.isArray(meaning.definitions) ? meaning.definitions.slice(0, per) : [];
            blocks.push(`\n${clean(meaning.partOfSpeech) || "unknown part of speech"}`);
            for (const def of defs) {
                blocks.push(`  - ${clean(def.definition)}`);
                if (def.example)
                    blocks.push(`    e.g. ${clean(def.example)}`);
            }
            if (meaning.synonyms?.length)
                blocks.push(`    synonyms: ${meaning.synonyms.slice(0, 8).join(", ")}`);
        }
    }
    const sources = [...new Set(rows.flatMap((r) => (r.sourceUrls ?? []).map(sameOrigin)).filter(Boolean))];
    if (sources.length)
        blocks.push(`\nSource: ${sources.join(", ")}`);
    return blocks.join("\n");
}
export async function synonyms(a) {
    const word = clean(a.word).toLowerCase();
    if (!/^[a-z][a-z'-]{0,44}$/.test(word))
        throw new SourceError("word must be letters, apostrophes or dashes");
    const d = await getJson(`/api/v2/entries/en/${encodeURIComponent(word)}`);
    const rows = entries(d, word);
    const blocks = [];
    const seen = new Set();
    for (const row of rows) {
        for (const meaning of row.meanings ?? []) {
            const syn = (meaning.synonyms ?? []).filter((s) => !seen.has(s));
            syn.forEach((s) => seen.add(s));
            const ant = meaning.antonyms ?? [];
            const fromDefs = (meaning.definitions ?? []).flatMap((def) => def.synonyms ?? []);
            for (const s of fromDefs) {
                if (!seen.has(s)) {
                    seen.add(s);
                    syn.push(s);
                }
            }
            if (!syn.length && !ant.length)
                continue;
            blocks.push(`${clean(meaning.partOfSpeech) || "?"}:`);
            if (syn.length)
                blocks.push(`  synonyms: ${syn.slice(0, 12).join(", ")}`);
            if (ant.length)
                blocks.push(`  antonyms: ${ant.slice(0, 12).join(", ")}`);
        }
    }
    if (!blocks.length)
        return `The dictionary lists no synonyms or antonyms for "${word}".`;
    return [
        `${clean(rows[0].word)}${phonetic(rows[0]) ? ` - ${phonetic(rows[0])}` : ""}`,
        "",
        ...blocks,
    ].join("\n");
}
