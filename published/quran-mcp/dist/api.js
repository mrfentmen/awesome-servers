/**
 * Al Quran Cloud — keyless public API client.
 */
const BASE = "https://api.alquran.cloud/v1";
const SOURCE = "Al Quran Cloud";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "quran-mcp", accept },
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
function check(result, what) {
    if (!result || (result.code && result.code !== 200)) {
        throw new SourceError(`${what}: ${clean(result?.data) || clean(result?.status) || "no data returned"}`);
    }
    return result.data;
}
export async function listSurahs() {
    const data = check(await getJson(`/surah`), "Quran chapters");
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length)
        throw new SourceError("Al Quran Cloud returned no chapters");
    return [
        `The Quran has ${rows.length} chapters:`,
        "",
        ...rows.map((s) => `${s.number}. ${clean(s.englishName)} / ${clean(s.name)} (${clean(s.englishNameTranslation) || "?"}) · ${s.numberOfAyahs} ayahs · ${clean(s.revelationType) || "?"}`),
    ].join("\n");
}
export async function getSurah(a) {
    if (!Number.isInteger(a.number) || a.number < 1 || a.number > 114)
        throw new SourceError("number must be between 1 and 114");
    const edition = clean(a.edition || "quran-uthmani");
    if (!/^[a-z0-9.-]{3,30}$/i.test(edition))
        throw new SourceError("edition must look like quran-uthmani or en.sahih");
    const data = check(await getJson(`/surah/${a.number}/${encodeURIComponent(edition)}`), `Surah ${a.number}`);
    const ayahs = Array.isArray(data?.ayahs) ? data.ayahs : [];
    if (!ayahs.length)
        throw new SourceError(`Al Quran Cloud returned no ayahs for surah ${a.number}`);
    return [
        `${data.number}. ${clean(data.englishName)} / ${clean(data.name)} - ${clean(data.englishNameTranslation) || ""} (${clean(data.revelationType) || "?"}, ${ayahs.length} ayahs)`,
        data.edition?.name ? `Edition: ${clean(data.edition.name)} (${clean(data.edition.identifier)})` : "",
        "",
        ...ayahs.map((y) => `${y.numberInSurah}. ${clean(y.text)}`),
    ].filter(Boolean).join("\n");
}
export async function getAyah(a) {
    const reference = clean(a.reference);
    if (!/^\d{1,3}:\d{1,3}$/.test(reference))
        throw new SourceError("reference must look like 2:255");
    const edition = clean(a.edition || "en.sahih");
    if (!/^[a-z0-9.-]{3,30}$/i.test(edition))
        throw new SourceError("edition must look like en.sahih");
    const data = check(await getJson(`/ayah/${reference}/${encodeURIComponent(edition)}`), `Ayah ${reference}`);
    if (!data?.text)
        throw new SourceError(`Al Quran Cloud has no ayah ${reference} in ${edition}`);
    return [
        `${clean(data.surah?.englishName)} ${data.numberInSurah ?? ""} (surah ${data.surah?.number}, ayah ${data.numberInSurah}) - ${edition}`,
        "",
        clean(data.text),
        data.surah?.revelationType ? `\nRevealed in ${clean(data.surah.revelationType)}` : "",
    ].filter(Boolean).join("\n");
}
export async function listEditions(a) {
    const language = clean(a.language || "en").toLowerCase();
    if (!/^[a-z]{2}$/.test(language))
        throw new SourceError("language must be a two-letter code");
    const format = clean(a.format || "text").toLowerCase();
    if (format !== "text" && format !== "audio")
        throw new SourceError("format must be text or audio");
    const limit = a.limit ?? 25;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new SourceError("limit must be between 1 and 50");
    const data = check(await getJson(`/edition?format=${format}&language=${language}`), "Editions");
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length)
        return `Al Quran Cloud has no ${format} editions in ${language}.`;
    return [
        `${rows.length} ${format} edition(s) in ${language} (showing ${Math.min(limit, rows.length)}):`,
        "",
        ...rows.slice(0, limit).map((e) => `- ${clean(e.identifier)} · ${clean(e.englishName || e.name)}${e.type ? ` · ${clean(e.type)}` : ""}${e.direction ? ` · ${clean(e.direction)}` : ""}`),
    ].join("\n");
}
