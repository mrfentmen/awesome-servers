/**
 * CERN Open Data API client, keyless.
 * Docs: https://opendata.cern.ch/docs/api
 */
const BASE = "http://opendata.cern.ch/api";
export class CernError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "cern-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new CernError("Not found.");
    if (!res.ok)
        throw new CernError(`CERN error ${res.status}`);
    return (await res.json());
}
export async function searchRecords(query, rtype = "", limit = 5) {
    const qs = new URLSearchParams({ q: query.trim(), size: String(Math.min(Math.max(limit, 1), 50)) });
    if (rtype.trim())
        qs.set("type", rtype.trim());
    const data = await getJson(`/records/?${qs}`);
    const rows = Array.isArray(data.hits?.hits) ? data.hits.hits : [];
    return rows.slice(0, limit).map((h) => {
        const md = h.metadata ?? {};
        return {
            id: h.id,
            title: md.title?.title ?? md.title,
            type: md.type?.primary,
            experiment: Array.isArray(md.collaboration) ? md.collaboration.map((c) => c.name ?? c).join(", ") : undefined,
            year: md.publication_year,
        };
    });
}
export async function getRecord(id) {
    if (!/^\d+$/.test(id.trim()))
        throw new CernError(`Record id must be numeric, got "${id}".`);
    const data = await getJson(`/records/${id.trim()}`);
    const md = data.metadata ?? {};
    const files = Array.isArray(data.files) ? data.files : [];
    const lines = [
        `[${data.id ?? id}] ${md.title?.title ?? md.title ?? "(untitled)"}`,
        md.abstract?.description ? `${String(md.abstract.description).replace(/<[^>]+>/g, "").slice(0, 400)}` : "",
        md.type?.primary ? `Type: ${md.type.primary}` : "",
        md.publication_year ? `Year: ${md.publication_year}` : "",
        files.length ? `Files: ${files.length} (e.g. ${String(files[0].key ?? files[0].uri ?? "").slice(0, 80)})` : "",
        `More: http://opendata.cern.ch/record/${data.id ?? id}`,
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatRecord(r, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${r.id ?? "?"}] ${r.title ?? "(untitled)"}${r.type ? ` (${r.type})` : ""}${r.experiment ? ` — ${r.experiment}` : ""}${r.year ? ` (${r.year})` : ""}`;
}

const CERN = 'https://opendata.cern.ch/api';
export async function recordFiles(args = {}) {
    const id = Number(args?.id);
    if (!Number.isInteger(id) || id < 1)
        throw new Error('Provide a CERN Open Data record id, like 1120.');
    const limit = Math.min(Math.max(Number(args?.limit ?? 50) || 50, 1), 200);
    const headers = { 'User-Agent': 'mrfentmen-cern-mcp/1.0', Accept: 'application/json' };
    const recRes = await fetch(`${CERN}/records/${id}`, { headers, signal: AbortSignal.timeout(25000) });
    if (recRes.status === 404)
        throw new Error(`CERN Open Data has no record ${id}`);
    if (!recRes.ok)
        throw new Error(`CERN Open Data returned ${recRes.status}`);
    const rec = (await recRes.json());
    const bucket = rec.links?.bucket;
    if (!bucket)
        return `${rec.metadata?.title ?? `Record ${id}`} has no file bucket.`;
    const bRes = await fetch(bucket, { headers, signal: AbortSignal.timeout(30000) });
    if (!bRes.ok)
        throw new Error(`The record's file bucket returned ${bRes.status}`);
    const contents = (await bRes.json()).contents ?? [];
    if (!contents.length)
        return `${rec.metadata?.title ?? `Record ${id}`} has an empty file bucket.`;
    const shown = contents.slice(0, limit);
    const totalBytes = contents.reduce((sum, f) => sum + Number(f.size ?? 0), 0);
    return [
        `${rec.metadata?.title ?? `Record ${id}`} — ${contents.length} file(s), ${(totalBytes / 1048576).toFixed(1)} MB total`,
        '',
        ...shown.map((f, i) => `${i + 1}. ${f.key} · ${f.mimetype ?? 'unknown type'} · ${(Number(f.size ?? 0) / 1024).toFixed(0)} KB · ${f.checksum ?? 'no checksum'}`),
        contents.length > shown.length ? `… ${contents.length - shown.length} more file(s).` : '',
    ].filter(Boolean).join('\n');
}
