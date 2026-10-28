/**
 * Cat Fact — keyless public API client.
 */
const BASE = "https://catfact.ninja";
const SOURCE = "Cat Fact";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "catfact-mcp", accept },
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
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
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
export async function randomCatFact() {
    const body = await getJson("/fact", "application/json", 25000);
    const fact = clean(body?.fact);
    if (!fact)
        throw new SourceError("catfact.ninja returned no fact");
    return `${fact}\n\n(${fact.length} characters)`;
}
export async function catBreeds(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const page = Math.floor(a.page ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 50)
        throw new SourceError("page must be between 1 and 50");
    const body = await getJson(`/breeds?limit=${limit}&page=${page}`, "application/json", 25000);
    const rows = Array.isArray(body?.data) ? body.data : [];
    if (!rows.length)
        throw new SourceError("catfact.ninja returned no breeds");
    const start = (Number(body?.current_page ?? page) - 1) * limit;
    return [
        `${body?.total ?? rows.length} breed(s) on record (page ${body?.current_page ?? page} of ${body?.last_page ?? "?"}), showing ${rows.length}:`,
        "",
        ...rows.map((r, i) => {
            const bits = [clean(r?.country), clean(r?.coat) ? `coat ${clean(r.coat)}` : "", clean(r?.pattern)].filter(Boolean);
            return `${String(start + i + 1).padStart(3)}. ${clean(r?.breed).padEnd(24)} ${bits.join(" · ")}`;
        }),
    ].join("\n");
}
export async function listFacts(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const page = Math.floor(a.page ?? 1);
    if (!Number.isInteger(page) || page < 1 || page > 50)
        throw new SourceError("page must be between 1 and 50");
    const body = await getJson(`/facts?limit=${limit}&page=${page}`, "application/json", 25000);
    const rows = Array.isArray(body?.data) ? body.data : [];
    if (!rows.length)
        throw new SourceError("catfact.ninja returned no facts");
    const start = (Number(body?.current_page ?? page) - 1) * limit;
    return [
        `${body?.total ?? rows.length} fact(s) on record (page ${body?.current_page ?? page} of ${body?.last_page ?? "?"}), showing ${rows.length}:`,
        "",
        ...rows.map((r, i) => `${String(start + i + 1).padStart(4)}. ${clean(r?.fact)}`),
    ].join("\n");
}
