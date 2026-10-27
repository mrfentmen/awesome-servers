const BASE = "https://rest.uniprot.org";
const UA = "mrfentmen-uniprot-mcp/1.0 (https://github.com/mrfentmen)";
export class UniprotError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new UniprotError(`UniProt returned HTTP ${res.status}`);
    return (await res.json());
}
export async function accession(args) {
    const acc = (args.accession ?? "").trim().toUpperCase();
    if (!acc)
        throw new UniprotError("Provide an accession like P12345");
    const d = await get(`${BASE}/uniprotkb/${encodeURIComponent(acc)}.json`);
    const lines = [
        `Accession: ${d?.primaryAccession ?? acc}`,
        `Name: ${d?.proteinDescription?.recommendedName?.fullName?.value ?? d?.proteinDescription?.submissionNames?.[0]?.fullName?.value ?? "n/a"}`,
        `Organism: ${d?.organism?.scientificName ?? "n/a"}`,
        `Gene: ${d?.genes?.[0]?.geneName?.value ?? "n/a"}`,
        `Length: ${d?.sequence?.length ?? "n/a"} amino acids`,
        `Reviewed: ${d?.entryType ?? "n/a"}`,
    ];
    const func = d?.comments?.find((c) => c?.commentType === "FUNCTION")?.text?.[0]?.value;
    if (func)
        lines.push(`\nFunction: ${func.slice(0, 500)}`);
    if (d?.sequence?.value) {
        const seq = d.sequence.value;
        lines.push(`\nSequence (first 80): ${seq.slice(0, 80)}${seq.length > 80 ? "..." : ""}`);
    }
    return lines.join("\n");
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new UniprotError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/uniprotkb/search?query=${encodeURIComponent(q)}&size=${limit}&format=json`);
    const results = (d?.results ?? []);
    if (!results.length)
        return `No proteins found for \"${q}\"`;
    return `UniProt results for \"${q}\" (${d?.results?.length ?? results.length} shown):\n` + results.map((r, i) => {
        const name = r?.proteinDescription?.recommendedName?.fullName?.value ?? r?.proteinDescription?.submissionNames?.[0]?.fullName?.value ?? "n/a";
        return `${i + 1}. ${r?.primaryAccession ?? "n/a"} | ${name} | ${r?.organism?.scientificName ?? "n/a"}`;
    }).join("\n");
}
export async function proteome(args) {
    const id = (args.id ?? "").trim().toUpperCase();
    if (!id)
        throw new UniprotError("Provide a proteome id like UP000005640");
    const d = await get(`${BASE}/proteomes/search?query=${encodeURIComponent(id)}&format=json&size=5`);
    const rows = (d?.results ?? []);
    const hit = rows.find((r) => String(r?.id ?? "").toUpperCase() === id) ?? rows[0];
    if (!hit)
        return `No proteome found: ${id}`;
    return `${hit.id} | ${String(hit.description ?? "").slice(0, 200)}\nTaxon: ${hit?.taxonomy?.scientificName ?? "?"} | Proteins: ${hit?.proteinCount ?? "?"}`;
}
export async function idmapRun(args) {
    const ids = (args.ids ?? "").trim();
    if (!ids)
        throw new UniprotError("Provide comma-separated accessions");
    const res = await fetch(`${BASE}/idmapping/run`, {
        method: "POST",
        headers: { "User-Agent": UA, Accept: "application/json", "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ from: (args.from ?? "UniProtKB_AC-ID").trim(), to: (args.to ?? "UniProtKB").trim(), ids }).toString(),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new UniprotError(`UniProt returned HTTP ${res.status}`);
    const d = (await res.json());
    if (!d.jobId)
        throw new UniprotError("No mapping job started");
    return `Mapping job ${d.jobId} started. Use idmap_status, then idmap_result.`;
}
export async function idmapStatus(args) {
    const job = (args.jobId ?? "").trim();
    if (!job)
        throw new UniprotError("Provide a job id");
    const d = await get(`${BASE}/idmapping/status/${encodeURIComponent(job)}`);
    return `Job ${job}: ${JSON.stringify(d).slice(0, 500)}`;
}
export async function idmapResult(args) {
    const job = (args.jobId ?? "").trim();
    if (!job)
        throw new UniprotError("Provide a job id");
    const d = await get(`${BASE}/idmapping/uniprotkb/results/${encodeURIComponent(job)}?format=json&size=25`);
    const rows = (d?.results ?? []);
    if (!rows.length)
        return `No results yet for ${job} (job may still run).`;
    return rows.map((r, i) => `${i + 1}. ${r?.from ?? "?"} -> ${r?.to?.primaryAccession ?? "?"}`).join("\n");
}
export async function taxonomy(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new UniprotError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/taxonomy/search?query=${encodeURIComponent(q)}&format=json&size=${limit}`);
    const rows = (d?.results ?? []);
    if (!rows.length)
        return `No taxa found for "${q}"`;
    return rows.map((t, i) => `${i + 1}. ${t?.scientificName ?? "?"} (taxon ${t?.taxonId ?? "?"})${t?.commonName ? ` aka ${t.commonName}` : ""}`).join("\n");
}
