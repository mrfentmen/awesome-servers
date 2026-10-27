/**
 * Bible API — keyless public API client.
 */
const BASE = "https://bible-api.com";
const SOURCE = "Bible API";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "bible-api-mcp", accept },
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
function passage(d, label) {
    const verses = Array.isArray(d?.verses) ? d.verses : [];
    if (!verses.length)
        throw new SourceError(`bible-api returned no verses for ${label}`);
    const body = verses.map((v) => `${v.chapter}:${v.verse} ${clean(v.text).replace(/\s+/g, " ").trim()}`).join("\n");
    return [
        `${clean(d.reference) || label} - ${clean(d.translation_name) || "translation"}`,
        "",
        body,
    ].join("\n");
}
export async function getPassage(a) {
    const reference = clean(a.reference);
    if (reference.length < 3)
        throw new SourceError("reference must be at least 3 characters");
    const translation = clean(a.translation || "kjv").toLowerCase();
    if (!/^[a-z0-9.-]{2,20}$/.test(translation))
        throw new SourceError("translation must look like kjv or web");
    const d = await getJson(`/${encodeURIComponent(reference)}?translation=${encodeURIComponent(translation)}`);
    if (d?.error)
        throw new SourceError(clean(d.error));
    return passage(d, `${reference} (${translation})`);
}
export async function randomVerse(a) {
    const translation = clean(a.translation || "kjv").toLowerCase();
    if (!/^[a-z0-9.-]{2,20}$/.test(translation))
        throw new SourceError("translation must look like kjv or web");
    const d = await getJson(`/?random=verse&translation=${encodeURIComponent(translation)}`);
    const verses = Array.isArray(d?.verses) ? d.verses : [];
    if (!verses.length)
        throw new SourceError("bible-api returned no random verse");
    const v = verses[0];
    return [
        `${clean(d.reference)} - ${clean(d.translation_name) || translation}`,
        "",
        `${v.chapter}:${v.verse} ${clean(v.text).replace(/\s+/g, " ").trim()}`,
    ].join("\n");
}
export async function listTranslations() {
    const d = await getJson(`/data`);
    const rows = Array.isArray(d?.translations) ? d.translations : [];
    if (!rows.length)
        throw new SourceError("bible-api returned no translations");
    return [
        `bible-api offers ${rows.length} translations:`,
        "",
        ...rows.map((t) => `- ${clean(t.identifier)}${clean(t.englishName) ? ` (${clean(t.englishName)})` : ""} · ${clean(t.language) || "?"}${clean(t.license) ? ` · ${clean(t.license).slice(0, 90)}` : ""}`),
    ].join("\n");
}
