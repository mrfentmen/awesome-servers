const UA = "mrfentmen-rcsb-pdb-mcp/1.0 (https://github.com/mrfentmen)";
export class PdbError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new PdbError(`RCSB returned HTTP ${res.status}`);
    return (await res.json());
}
export async function entry(args) {
    const id = (args.id ?? "").trim().toLowerCase();
    if (!/^[a-z0-9]{4}$/.test(id))
        throw new PdbError("Provide a 4 character PDB ID like 4hhb");
    const d = await get(`https://data.rcsb.org/rest/v1/core/entry/${encodeURIComponent(id)}`);
    const info = d?.rcsb_entry_info ?? {};
    const methods = (d?.exptl ?? []).map((e) => e?.method ?? "").filter(Boolean).join(", ");
    const lines = [
        `PDB ID: ${id.toUpperCase()}`,
        `Title: ${d?.struct?.title ?? "n/a"}`,
        `Resolution: ${info?.resolution_combined?.[0] != null ? `${info.resolution_combined[0]} A` : "n/a"}`,
        `Method: ${methods || "n/a"}`,
        `Released: ${info?.release_date ?? "n/a"}`,
        `Entities: ${info?.polymer_entity_count ?? "n/a"}`,
        `Formula weight: ${info?.polymer_molecular_weight_maximum != null ? `${info.polymer_molecular_weight_maximum.toLocaleString()} Da` : "n/a"}`,
    ];
    return lines.join("\n");
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new PdbError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const body = {
        query: { type: "terminal", service: "full_text", parameters: { value: q } },
        return_type: "entry",
        request_options: { paginate: { start: 0, rows: limit }, results_content_type: ["experimental"] },
    };
    const res = await fetch("https://search.rcsb.org/rcsbsearch/v2/query", {
        method: "POST",
        headers: { "Content-Type": "application/json", "User-Agent": UA, Accept: "application/json" },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new PdbError(`RCSB search returned HTTP ${res.status}`);
    const d = (await res.json());
    const ids = (d?.result_set ?? []).map((r) => r?.identifier ?? "").filter(Boolean).slice(0, limit);
    if (!ids.length)
        return "No structures found";
    return `Structures matching \"${q}\":\n` + ids.map((i, n) => `${n + 1}. ${i.toUpperCase()}`).join("\n");
}
// ---- muxB tools:
const RCSB = 'https://data.rcsb.org/rest/v1/core';
export async function publications(args) {
    const id = (args.id ?? '').trim().toLowerCase();
    if (!/^[a-z0-9]{4}$/.test(id))
        throw new PdbError("Provide a 4 character PDB ID like 4hhb");
    const d = await get(`${RCSB}/entry/${encodeURIComponent(id)}`);
    const rows = Array.isArray(d?.citation) ? d.citation : [];
    if (!rows.length)
        return `No primary publications listed for ${id.toUpperCase()}.`;
    return `Publications for ${id.toUpperCase()} (${rows.length} listed):\n` +
        rows.map((c, i) => {
            const authors = Array.isArray(c?.rcsb_authors) ? c.rcsb_authors.join(', ') : 'not reported';
            const year = c?.year != null ? String(c.year) : 'not reported';
            const journal = c?.rcsb_journal_abbrev ?? c?.journal_abbrev ?? 'not reported';
            const doi = c?.pdbx_database_id_DOI ?? 'not reported';
            const pmid = c?.pdbx_database_id_PubMed != null ? String(c.pdbx_database_id_PubMed) : 'not reported';
            return [
                `${i + 1}. ${String(c?.title ?? 'title not reported').slice(0, 160)}`,
                `   ${journal} (${year}) | ${c?.rcsb_is_primary === 'Y' ? 'primary citation' : 'additional citation'}`,
                `   authors: ${String(authors).slice(0, 160)}`,
                `   DOI: ${doi} | PubMed: ${pmid}`,
            ].join('\n');
        }).join('\n');
}
