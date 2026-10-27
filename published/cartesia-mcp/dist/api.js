export class CartesiaError extends Error {
    constructor(message) {
        super(message);
        this.name = "CartesiaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.cartesia.ai";
function key() {
    const k = process.env.CARTESIA_API_KEY;
    if (!k)
        throw new CartesiaError("Set CARTESIA_API_KEY (free Cartesia tier).");
    return k;
}
function hdrs() {
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${key()}`, "Cartesia-Version": "2026-08-14" };
}
async function get(path) {
    let res;
    try {
        res = await fetch(BASE + path, { signal: AbortSignal.timeout(30000), headers: hdrs() });
    }
    catch (e) {
        throw new CartesiaError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok)
        throw new CartesiaError(`HTTP ${res.status}: ${text.slice(0, 200)}`);
    return text;
}
export function listVoices(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return get("/voices").then((t) => {
        try {
            const d = JSON.parse(t);
            return JSON.stringify(Array.isArray(d) ? d.slice(0, n) : d, null, 2);
        }
        catch {
            return t.slice(0, 4000);
        }
    });
}
export function getVoice(voiceId) {
    return get(`/voices/${encodeURIComponent(voiceId)}`);
}
export function synthesizeSpeech(transcript, voiceId, modelId) {
    return (async () => {
        let res;
        try {
            res = await fetch(BASE + "/tts/bytes", {
                signal: AbortSignal.timeout(30000),
                method: "POST",
                headers: { ...UA, Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key()}`, "Cartesia-Version": "2026-08-14" },
                body: JSON.stringify({ model_id: modelId ?? "sonic-2", transcript, voice: { mode: "id", id: voiceId }, output_format: { container: "mp3", sample_rate: 44100, encoding: "mp3" } }),
            });
        }
        catch (e) {
            throw new CartesiaError(`Network error: ${e.message}`);
        }
        if (res.status === 401 || res.status === 403)
            throw new CartesiaError(`HTTP ${res.status}: invalid API key.`);
        if (!res.ok) {
            const body = (await res.text()).slice(0, 300);
            throw new CartesiaError(`HTTP ${res.status}: ${body}`);
        }
        const buf = Buffer.from(await res.arrayBuffer());
        return `Synthesized ${buf.length} bytes of MP3 audio (not embedded; paid usage).`;
    })();
}
/**
 * GET /voices. Query args follow the documented parameters: limit (1-100),
 * starting_after / ending_before cursors, q, is_owner, gender, language and
 * expand[]=preview_file_url. Response is { data, has_more, next_page }.
 */
async function voicePage(params) {
    let res;
    try {
        res = await fetch(`${BASE}/voices?${params.toString()}`, { signal: AbortSignal.timeout(30000), headers: hdrs() });
    }
    catch (e) {
        throw new CartesiaError(`Network error: ${errorMessage(e)}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new CartesiaError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.json());
}
const GENDERS = ["masculine", "feminine", "gender_neutral"];
/** Search the voice library by name, description or id, with language and gender filters. */
export async function searchVoices(args) {
    const params = new URLSearchParams({ limit: String(Math.max(1, Math.min(args.limit ?? 20, 100))), "expand[]": "preview_file_url" });
    const q = (args.query ?? "").trim();
    if (q)
        params.set("q", q);
    const lang = (args.language ?? "").trim().toLowerCase();
    if (lang)
        params.set("language", lang);
    const g = (args.gender ?? "").trim().toLowerCase();
    if (g) {
        if (!GENDERS.includes(g))
            throw new CartesiaError(`gender must be one of: ${GENDERS.join(", ")}.`);
        params.set("gender", g);
    }
    const page = await voicePage(params);
    const rows = Array.isArray(page.data) ? page.data : [];
    const scope = [q ? `query "${q}"` : null, lang ? `language ${lang}` : null, g ? `gender ${g}` : null].filter(Boolean).join(", ");
    if (!rows.length)
        return `No Cartesia voice matched ${scope || "an unfiltered search"}.`;
    const lines = [
        `Cartesia voices matching ${scope || "an unfiltered search"} — ${rows.length} on this page, ${page.has_more ? "more available" : "no further pages"}`,
        "",
    ];
    for (const v of rows) {
        lines.push(`[${v.id ?? "?"}] ${v.name ?? "(unnamed)"}${v.tagline ? ` — ${v.tagline}` : ""}`);
        const bits = [];
        bits.push(`language ${v.language ?? "not reported"}`);
        if (v.gender)
            bits.push(`gender ${v.gender}`);
        if (v.country)
            bits.push(`country ${v.country}`);
        if (v.is_pro === true)
            bits.push("pro clone");
        bits.push(v.is_owner === true ? "owned by your org" : `access ${v.access?.type ?? "not reported"}`);
        lines.push(`  ${bits.join(" | ")}`);
        const locales = Array.isArray(v.locales) ? v.locales : [];
        if (locales.length) {
            const native = locales.filter((l) => l.is_native).map((l) => l.locale);
            const cross = locales.filter((l) => !l.is_native).map((l) => l.locale);
            lines.push(`  locales: ${native.join(", ") || "native not reported"}${cross.length ? ` | cross-lingual: ${cross.join(", ")}` : ""}`);
        }
        lines.push(`  preview: ${v.preview_file_url ? "available" : "none published"}`);
        if (v.description)
            lines.push(`  ${String(v.description).replace(/\s+/g, " ").trim().slice(0, 160)}`);
        lines.push("");
    }
    if (page.next_page)
        lines.push(`Next page cursor: ${page.next_page}`);
    return lines.join("\n").trimEnd();
}
/** Walk the voice library with cursor pagination and count it by language and gender. */
export async function languageRollCall(args) {
    const maxPages = Math.max(1, Math.min(args.pages ?? 3, 10));
    const byLanguage = new Map();
    const byGender = new Map();
    const multiLocale = [];
    const seen = new Set();
    let scanned = 0;
    let pagesFetched = 0;
    let cursor;
    let truncated = false;
    for (let page = 0; page < maxPages; page += 1) {
        const params = new URLSearchParams({ limit: "100", "expand[]": "preview_file_url" });
        if (cursor)
            params.set("starting_after", cursor);
        const body = await voicePage(params);
        const rows = Array.isArray(body.data) ? body.data : [];
        pagesFetched += 1;
        for (const v of rows) {
            const key = v.id ?? `${v.name}-${scanned}`;
            if (seen.has(key))
                continue;
            seen.add(key);
            scanned += 1;
            const lang = v.language ?? "language not reported";
            byLanguage.set(lang, (byLanguage.get(lang) ?? 0) + 1);
            const g = v.gender ?? "gender not reported";
            byGender.set(g, (byGender.get(g) ?? 0) + 1);
            const n = Array.isArray(v.locales) ? v.locales.length : 0;
            if (n > 1)
                multiLocale.push({ v, n });
        }
        if (body.has_more !== true || !body.next_page)
            break;
        cursor = body.next_page;
        if (rows.length === 0)
            break;
    }
    if (!scanned)
        throw new CartesiaError("Cartesia returned no voices to roll call.");
    if (cursor)
        truncated = true;
    const langs = [...byLanguage.entries()].sort((a, b) => b[1] - a[1]);
    const genders = [...byGender.entries()].sort((a, b) => b[1] - a[1]);
    const lines = [
        `Cartesia voice library: ${scanned} distinct voice(s) across ${pagesFetched} page(s) of up to 100`,
        truncated ? "The library reports more pages, so these counts cover only the pages scanned." : "The library reports no further pages, so these counts cover everything on this key.",
        "",
        `Languages found (${langs.length}):`,
        ...langs.map(([l, n]) => `  ${l}: ${n}`),
        "",
        `Gender presentation (${genders.length}):`,
        ...genders.map(([g, n]) => `  ${g}: ${n}`),
    ];
    if (multiLocale.length) {
        lines.push("", `Voices speaking more than one locale (${multiLocale.length} of ${scanned}):`);
        for (const { v, n } of multiLocale.sort((a, b) => b.n - a.n).slice(0, 10)) {
            const codes = (v.locales ?? []).map((l) => l.locale).filter(Boolean).join(", ");
            lines.push(`  ${v.name ?? "(unnamed)"} [${v.id ?? "?"}] — ${n} locales: ${codes}`);
        }
        if (multiLocale.length > 10)
            lines.push(`  ...and ${multiLocale.length - 10} more multilingual voice(s).`);
    }
    return lines.join("\n");
}
/** Shortlist a voice for a job: filter by language, prefer multilingual ones, show previews. */
export async function pickVoice(args) {
    const lang = (args.language ?? "").trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(lang))
        throw new CartesiaError("Provide a two-letter language code, e.g. en or fr.");
    const want = (args.use_case ?? "").trim().toLowerCase();
    const n = Math.max(1, Math.min(args.limit ?? 8, 25));
    const rows = [];
    for (let page = 0; page < 3 && rows.length < n * 2; page += 1) {
        const params = new URLSearchParams({ language: lang, limit: "100", "expand[]": "preview_file_url" });
        const body = await voicePage(params);
        if (Array.isArray(body.data))
            rows.push(...body.data);
        if (body.has_more !== true)
            break;
    }
    if (!rows.length)
        return `Cartesia lists no voice for language "${lang}".`;
    const scored = rows
        .map((v) => {
        const locales = Array.isArray(v.locales) ? v.locales : [];
        const hay = `${v.name ?? ""} ${v.tagline ?? ""} ${v.description ?? ""}`.toLowerCase();
        let score = locales.length;
        let why = `${locales.length} locale(s)`;
        if (want && hay.includes(want)) {
            score += 5;
            why += `, description or tagline mentions "${want}"`;
        }
        if (v.preview_file_url) {
            score += 1;
            why += ", has a preview";
        }
        return { v, score, why };
    })
        .sort((a, b) => b.score - a.score);
    const lines = [
        `Cartesia voice shortlist for ${lang}${want ? ` with "${want}" in the description or tagline` : ""}`,
        `${rows.length} voice(s) carry language ${lang} in the pages scanned; showing up to ${Math.min(n, scored.length)}, ranked by how many locales each voice speaks.`,
        "",
    ];
    for (const [i, s] of scored.slice(0, n).entries()) {
        const v = s.v;
        lines.push(`${i + 1}. ${v.name ?? "(unnamed)"} [${v.id ?? "?"}] — score ${s.score} (${s.why})`);
        const bits = [];
        if (v.gender)
            bits.push(`gender ${v.gender}`);
        if (v.country)
            bits.push(`country ${v.country}`);
        if (v.is_pro === true)
            bits.push("pro clone");
        if (bits.length)
            lines.push(`   ${bits.join(" | ")}`);
        if (v.tagline)
            lines.push(`   ${v.tagline}`);
        if (v.preview_file_url)
            lines.push(`   preview available — fetch it with the same Authorization header, it is not stable to store`);
        else
            lines.push(`   no preview published`);
    }
    if (!want)
        lines.push("", "Pass a use_case to prefer voices whose description or tagline mentions it.");
    return lines.join("\n");
}
