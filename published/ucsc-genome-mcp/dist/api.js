/**
 * UCSC Genome Browser — keyless public API client.
 */
const BASE = "https://api.genome.ucsc.edu";
const SOURCE = "UCSC Genome Browser";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ucsc-genome-mcp", accept },
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
function checkName(label, value) {
    const v = clean(value);
    if (!/^[A-Za-z0-9._-]{1,40}$/.test(v))
        throw new SourceError(`${label} "${value}" is not valid`);
    return v;
}
export async function listGenomes(a) {
    const limit = clampLimit(a.limit, 20, 50);
    const data = await getJson("/list/ucscGenomes", "application/json", 30000);
    const genomes = data?.ucscGenomes;
    if (!genomes || typeof genomes !== "object")
        throw new SourceError("UCSC returned an unexpected payload");
    const needle = clean(a.query).toLowerCase();
    const rows = Object.entries(genomes)
        .map(([name, meta]) => ({ name, meta }))
        .filter(({ name, meta }) => !needle || [name, meta?.organism, meta?.description].some((v) => clean(v).toLowerCase().includes(needle)));
    if (!rows.length)
        return `No UCSC genome matches "${clean(a.query)}".`;
    return [
        `${rows.length} genome(s)${needle ? ` matching "${clean(a.query)}"` : ""} (showing ${Math.min(limit, rows.length)}):`,
        "",
        ...rows.slice(0, limit).map(({ name, meta }, i) => `${i + 1}. ${name} - ${clean(meta?.description).slice(0, 70)}${meta?.organism ? ` · ${clean(meta.organism)}` : ""}`),
    ].join("\n");
}
export async function listChromosomes(a) {
    const limit = clampLimit(a.limit, 10, 50);
    const genome = checkName("genome", a.genome);
    const data = await getJson(`/list/chromosomes?genome=${genome}`, "application/json", 30000);
    const chroms = data?.chromosomes;
    if (!chroms || typeof chroms !== "object")
        throw new SourceError(`UCSC has no assembly "${genome}"`);
    const rows = Object.entries(chroms).map(([name, meta]) => ({ name, size: Number(meta?.size ?? meta ?? 0) }));
    const total = rows.reduce((sum, r) => sum + r.size, 0);
    const bySize = [...rows].sort((x, y) => y.size - x.size);
    return [
        `${genome}: ${rows.length} sequence(s), ${(total / 1e6).toFixed(1)} Mb total (chromCount field: ${data?.chromCount ?? "?"})`,
        "",
        `Largest ${Math.min(limit, bySize.length)}:`,
        ...bySize.slice(0, limit).map((r, i) => `${i + 1}. ${r.name} · ${(r.size / 1e6).toFixed(2)} Mb`),
    ].join("\n");
}
export async function getSequence(a) {
    const genome = checkName("genome", a.genome);
    const chrom = checkName("chromosome", a.chrom);
    const start = Math.floor(a.start);
    const end = Math.floor(a.end);
    if (!Number.isInteger(start) || !Number.isInteger(end) || start < 0 || end <= start)
        throw new SourceError("give a start >= 0 and an end greater than start");
    const span = end - start;
    if (span > 10000)
        throw new SourceError(`the range is ${span} bases; the limit is 10000 per call`);
    const data = await getJson(`/getData/sequence?genome=${genome};chrom=${chrom};start=${start};end=${end}`, "application/json", 30000);
    const dna = clean(data?.dna).toUpperCase();
    if (!dna)
        throw new SourceError(`UCSC returned no sequence for ${genome} ${chrom}:${start}-${end}`);
    const gc = [...dna].filter((c) => c === "G" || c === "C").length;
    const ns = [...dna].filter((c) => c === "N").length;
    const preview = dna.length > 120 ? `${dna.slice(0, 120)} ...` : dna;
    return [
        `${genome} ${chrom}:${start}-${end} (${dna.length} base(s))`,
        "",
        preview,
        "",
        `GC content: ${((gc / dna.length) * 100).toFixed(1)}% · N bases: ${ns}`,
        ns > dna.length / 2 ? "Mostly N - this region is a gap in the assembly." : "",
    ].filter(Boolean).join("\n");
}
export async function searchGenome(a) {
    const limit = clampLimit(a.limit, 5, 20);
    const genome = checkName("genome", a.genome);
    const term = clean(a.term);
    if (!term)
        throw new SourceError("give a search term");
    const data = await getJson(`/search?search=${encodeURIComponent(term)}&genome=${genome}`, "application/json", 30000);
    const positions = Array.isArray(data?.positionMatches) ? data.positionMatches : [];
    if (!positions.length)
        return `No UCSC position matches for "${term}" in ${genome}.`;
    const lines = [`Position matches for "${term}" in ${genome}:`, ""];
    for (const track of positions.slice(0, limit)) {
        const matches = Array.isArray(track?.matches) ? track.matches : [];
        lines.push(`${clean(track?.trackName) || clean(track?.name) || "(track)"}: ${matches.length} match(es)`);
        for (const m of matches.slice(0, 3)) {
            lines.push(`   - ${clean(m?.position)}${m?.posName ? ` (${clean(m.posName)})` : ""}`);
        }
    }
    return lines.join("\n");
}
