/**
 * ITIS (Integrated Taxonomic Information System) JSON service client, keyless.
 * Docs: https://www.itis.gov/ws_description.html
 */
const BASE = "https://www.itis.gov/ITISWebService/jsonservice";
export class ItisError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "itis-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new ItisError(`ITIS error ${res.status}`);
    return (await res.json());
}
export async function searchScientific(name, limit = 5) {
    const data = await getJson(`/searchByScientificName?srchKey=${encodeURIComponent(name)}`);
    const rows = Array.isArray(data.scientificNames) ? data.scientificNames : [];
    return rows.slice(0, limit).map((r) => ({
        tsn: String(r.tsn ?? "?"),
        name: String(r.combinedName ?? "?"),
        author: r.author,
    }));
}
export async function commonNames(tsn, limit = 10) {
    if (!/^\d+$/.test(tsn.trim()))
        throw new ItisError(`TSN must be numeric, got "${tsn}".`);
    const data = await getJson(`/getCommonNamesFromTSN?tsn=${tsn.trim()}`);
    const rows = Array.isArray(data.commonNames) ? data.commonNames : [];
    return rows.slice(0, limit).map((r) => String(r.commonName)).filter(Boolean);
}
export async function hierarchy(tsn) {
    if (!/^\d+$/.test(tsn.trim()))
        throw new ItisError(`TSN must be numeric, got "${tsn}".`);
    const data = await getJson(`/getHierarchyDownFromTSN?tsn=${tsn.trim()}`);
    const rows = Array.isArray(data.hierarchyList) ? data.hierarchyList : [];
    return rows.slice(0, 15).map((r) => `${String(r.rankName ?? "?")}: ${String(r.taxonName ?? "?")}`);
}
export function formatTaxon(t, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${t.tsn}] ${t.name}${t.author ? ` ${t.author}` : ""}`;
}
function clean(value) {
    return typeof value === 'string' ? value.replace(/\s+/g, ' ').trim() : '';
}
function or(value) {
    return clean(value) || 'not reported';
}
function list(value) {
    return Array.isArray(value) ? value.filter((x) => x !== null && x !== undefined) : [];
}
// ITIS still carries legacy Latin-1 bytes in some names, so a strict UTF-8
// decode would throw on an otherwise good record. Fall back rather than fail.
async function fullRecord(tsn) {
    const res = await fetch(`${BASE}/getFullRecordFromTSN?tsn=${encodeURIComponent(tsn)}`, {
        headers: { 'User-Agent': 'itis-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new ItisError(`ITIS error ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    let body;
    try {
        body = new TextDecoder('utf-8', { fatal: true }).decode(bytes);
    }
    catch {
        body = new TextDecoder('latin1').decode(bytes);
    }
    let parsed;
    try {
        parsed = JSON.parse(body);
    }
    catch {
        throw new ItisError(`ITIS returned a record for TSN ${tsn} that is not valid JSON.`);
    }
    if (!parsed || typeof parsed !== 'object')
        throw new ItisError(`ITIS returned no full record for TSN ${tsn}.`);
    return parsed;
}
function numericTsn(value) {
    const raw = String(value ?? '').trim();
    return /^\d+$/.test(raw) ? raw : '';
}
/** Every synonym ITIS holds for a taxon, with the name each one redirects to and whether the taxon itself is accepted. */
export async function synonymReport(args) {
    const tsn = numericTsn((args.tsn ?? '').toString());
    if (!tsn)
        throw new ItisError(`TSN must be numeric, got "${args.tsn ?? ''}".`);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 25), 60));
    const d = await fullRecord(tsn);
    const name = or(d.scientificName?.combinedName);
    const synonyms = list(d.synonymList?.synonyms);
    const usage = or(d.usage?.taxonUsageRating);
    const lines = [
        `Synonyms of ${name} (TSN ${tsn})`,
        `Usage rating: ${usage}${usage && usage.toLowerCase() !== 'valid' ? ' - this taxon is not the accepted one, so treat it as a synonym itself' : ''}`,
        `Synonyms on file: ${synonyms.length}`,
    ];
    if (!synonyms.length) {
        lines.push('ITIS holds no synonym list for this taxon.');
        return lines.join('\n');
    }
    const withAccepted = synonyms.filter((s) => clean(s.acceptedName));
    lines.push(`Of those, ${withAccepted.length} name the taxon they are accepted under inside ITIS.`);
    for (const s of synonyms.slice(0, limit)) {
        const parts = [`- ${or(s.sciName ?? s.combinedName)}`];
        if (clean(s.author))
            parts.push(` ${clean(s.author)}`);
        if (clean(s.tsn))
            parts.push(` | TSN ${s.tsn}`);
        if (clean(s.acceptedName))
            parts.push(` -> accepted as ${clean(s.acceptedName)}`);
        lines.push(parts.join(''));
    }
    if (synonyms.length > limit)
        lines.push(`... and ${synonyms.length - limit} more synonym(s).`);
    return lines.join('\n');
}
function rangeEntries(value) {
    return Array.isArray(value) ? value.filter((x) => x !== null && x !== undefined) : [];
}
function rangeStamp(value) {
    return value ? String(value).slice(0, 10) : 'no date recorded';
}
