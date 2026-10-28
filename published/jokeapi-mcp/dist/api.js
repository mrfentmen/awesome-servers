/**
 * JokeAPI — keyless public API client.
 */
const BASE = "https://v2.jokeapi.dev";
const SOURCE = "JokeAPI";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "jokeapi-mcp", accept },
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
const SAFE_CATEGORIES = ["Any", "Misc", "Programming", "Pun", "Spooky", "Christmas"];
const ALL_CATEGORIES = [...SAFE_CATEGORIES, "Dark"];
function query(category, safeMode, extra = "") {
    const cat = ALL_CATEGORIES.includes(category) ? category : "Any";
    if (cat === "Dark" && safeMode)
        throw new SourceError("Dark jokes are excluded by safe mode; call again with safeMode false if that is what you want");
    const flags = safeMode ? "safe-mode&" : "";
    return `/joke/${cat}?${flags}type=single,twopart${extra}`;
}
function render(j) {
    if (j?.type === "twopart")
        return `${clean(j.setup)}\n  ... ${clean(j.delivery)}\n  (${clean(j.category)} · ${clean(j.id)})`;
    return `${clean(j?.joke)}\n  (${clean(j?.category)} · ${clean(j?.id)})`;
}
export async function randomJoke(a) {
    const d = await getJson(query(clean(a.category) || "Any", a.safeMode !== false));
    if (d?.error)
        throw new SourceError(clean(d.message) || "JokeAPI rejected the request");
    return render(d);
}
export async function jokesBatch(a) {
    const amount = a.amount ?? 3;
    if (!Number.isInteger(amount) || amount < 2 || amount > 10)
        throw new SourceError("amount must be between 2 and 10");
    const d = await getJson(query(clean(a.category) || "Any", a.safeMode !== false, `&amount=${amount}`));
    if (d?.error)
        throw new SourceError(clean(d.message) || "JokeAPI rejected the request");
    const rows = Array.isArray(d?.jokes) ? d.jokes : [];
    if (!rows.length)
        throw new SourceError("JokeAPI returned no jokes");
    return [
        `${rows.length} ${clean(a.category) || "Any"} jokes (${a.safeMode === false ? "safe mode off" : "safe mode on"}):`,
        "",
        ...rows.map((j, i) => `${i + 1}. ${render(j)}`),
    ].join("\n");
}
