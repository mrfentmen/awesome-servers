/**
 * OEIS client. The On-Line Encyclopedia of Integer Sequences, keyless.
 * The fmt=json endpoint returns a plain array of sequence objects.
 */
const BASE = "https://oeis.org";
export class OeisError extends Error {
}
export async function searchSequences(query, limit = 5) {
    const url = `${BASE}/search?q=${encodeURIComponent(query)}&fmt=json`;
    const res = await fetch(url, {
        headers: { "User-Agent": "oeis-mcp/1.0" },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new OeisError(`OEIS error ${res.status}`);
    const data = (await res.json());
    return Array.isArray(data) ? data.slice(0, limit) : [];
}
export async function getSequence(id) {
    const clean = id.trim().replace(/^A0*/, "A");
    const results = await searchSequences(`id:${clean}`, 1);
    return results[0] ?? null;
}
export function aNumber(s) {
    return `A${String(s.number).padStart(6, "0")}`;
}
export function formatSequence(s, index) {
    const lines = [
        `${index !== undefined ? `${index + 1}. ` : ""}[${aNumber(s)}] ${s.name ?? "(unnamed sequence)"}`,
        s.data ? `Data: ${s.data.slice(0, 260)}${s.data.length > 260 ? "..." : ""}` : "",
        s.keyword ? `Keywords: ${s.keyword}` : "",
        s.offset ? `Offset: ${s.offset}` : "",
        s.comment?.length ? `Comment: ${s.comment[0].slice(0, 200)}` : "",
        s.formula?.length ? `Formula: ${s.formula[0].slice(0, 200)}` : "",
        s.author ? `Author: ${s.author}` : "",
        s.xrefs ? `Cross refs: ${s.xrefs.slice(0, 160)}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
