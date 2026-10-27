/**
 * RCSB Protein Data Bank. Two keyless services are used together:
 *  - search.rcsb.org (POST) for full-text search across ~230k structures
 *  - data.rcsb.org (GET) for entry, entity, ligand and citation records
 */
const SEARCH = "https://search.rcsb.org/rcsbsearch/v2/query";
const DATA = "https://data.rcsb.org/rest/v1/core";
export class PdbError extends Error {
}
async function request(url, init = {}, timeoutMs = 30000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            ...init,
            signal: ctrl.signal,
            headers: { "user-agent": "pdb-mcp", accept: "application/json", ...(init.headers ?? {}) },
        });
        if (res.status === 404)
            throw new PdbError("RCSB PDB has no record for that id");
        if (res.status === 204)
            return null;
        if (!res.ok)
            throw new PdbError(`RCSB PDB responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof PdbError)
            throw e;
        if (e.name === "AbortError")
            throw new PdbError("RCSB PDB request timed out");
        if (e instanceof SyntaxError)
            throw new PdbError("RCSB PDB returned malformed JSON");
        throw new PdbError(`RCSB PDB request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const pdbId = (id) => {
    const v = id.trim().toUpperCase();
    if (!/^[0-9A-Z]{4}$/.test(v))
        throw new PdbError(`"${id}" is not a 4-character PDB id`);
    return v;
};
export async function searchStructures(query, limit) {
    const q = query.trim();
    if (q.length < 2)
        throw new PdbError("Search term must be at least 2 characters");
    const body = {
        query: { type: "terminal", service: "full_text", parameters: { value: q } },
        return_type: "entry",
        request_options: { paginate: { start: 0, rows: Math.min(limit, 50) } },
    };
    const d = await request(SEARCH, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
    });
    const rows = d?.result_set ?? [];
    if (rows.length === 0)
        return `No PDB structures match "${query}".`;
    return [
        `PDB structures matching "${query}" (showing ${rows.length} of ${Number(d.total_count ?? rows.length).toLocaleString("en-US")}):`,
        "",
        ...rows.map((r, i) => `${i + 1}. ${String(r.identifier).toUpperCase()}`),
        "",
        "Use structure_summary for any id above.",
    ].join("\n");
}
const getEntry = (id) => request(`${DATA}/entry/${pdbId(id)}`);
export async function structureSummary(id) {
    const e = await getEntry(id);
    const authors = (e.audit_author ?? []).map((a) => a.name).filter(Boolean);
    const method = e.exptl?.[0]?.method ?? e.rcsb_entry_info?.experimental_method ?? "unknown";
    const resolution = e.refine_hist?.find((r) => typeof r.resolution_high === "number")?.resolution_high;
    return [
        `${pdbId(id)} — ${e.struct?.title ?? "untitled structure"}`,
        `Method: ${method}${resolution ? ` · resolution ${resolution.toFixed(2)} Å` : ""}`,
        `Released: ${String(e.rcsb_accession_info?.initial_release_date ?? "").slice(0, 10) || "unknown"}`,
        // rcsb_entry_info.molecular_weight is reported in kDa.
        e.rcsb_entry_info?.molecular_weight ? `Molecular weight: ${Number(e.rcsb_entry_info.molecular_weight).toFixed(2)} kDa` : "",
        `Authors: ${authors.slice(0, 8).join(", ")}${authors.length > 8 ? ` (+${authors.length - 8} more)` : ""}`,
        `Entities: ${e.rcsb_entry_container_identifiers?.polymer_entity_ids?.length ?? 0} polymer, ${e.rcsb_entry_container_identifiers?.non_polymer_entity_ids?.length ?? 0} non-polymer`,
        `https://www.rcsb.org/structure/${pdbId(id)}`,
    ]
        .filter(Boolean)
        .join("\n");
}
export async function structureChains(id) {
    const e = await getEntry(id);
    const ids = e.rcsb_entry_container_identifiers?.polymer_entity_ids ?? [];
    if (ids.length === 0)
        return `${pdbId(id)} has no polymer entities.`;
    const entities = await Promise.all(ids.map((n) => request(`${DATA}/polymer_entity/${pdbId(id)}/${n}`).catch(() => null)));
    const lines = entities.map((ent, i) => {
        if (!ent)
            return `${i + 1}. entity ${ids[i]} — could not be read`;
        const poly = ent.entity_poly ?? {};
        const name = ent.rcsb_polymer_entity?.pdbx_description ?? "unnamed";
        const len = poly.rcsb_sample_sequence_length ?? poly.pdbx_seq_one_letter_code_length ?? "?";
        const chains = (ent.rcsb_polymer_entity_container_identifiers?.auth_asym_ids ?? []).join(", ");
        return `${i + 1}. entity ${ids[i]} — ${name}\n   chain(s) ${chains || "?"} · ${len} residues · ${ent.entity_poly?.type ?? "polymer"}`;
    });
    return [`${pdbId(id)} polymer chains (${ids.length}):`, "", ...lines].join("\n");
}
export async function structureLigands(id) {
    const e = await getEntry(id);
    const ids = e.rcsb_entry_container_identifiers?.non_polymer_entity_ids ?? [];
    if (ids.length === 0)
        return `${pdbId(id)} has no non-polymer (ligand) entities.`;
    const entities = await Promise.all(ids.map((n) => request(`${DATA}/nonpolymer_entity/${pdbId(id)}/${n}`).catch(() => null)));
    const lines = entities.map((ent, i) => {
        if (!ent)
            return `${i + 1}. ligand entity ${ids[i]} — could not be read`;
        const comp = ent.pdbx_entity_nonpoly?.comp_id ?? "?";
        const name = ent.pdbx_entity_nonpoly?.name ?? ent.rcsb_nonpolymer_entity?.pdbx_description ?? "unnamed";
        // formula_weight on ligand entities is reported in kDa; the chem-comp API uses Da.
        const weight = ent.rcsb_nonpolymer_entity?.formula_weight;
        return `${i + 1}. ${comp} — ${name}${weight ? ` (${(Number(weight) * 1000).toFixed(0)} Da)` : ""}`;
    });
    return [
        `${pdbId(id)} ligands (${ids.length}):`,
        "",
        ...lines,
        "",
        "Use ligand_info for formula and synonyms of any ligand id.",
    ].join("\n");
}
export async function ligandInfo(compId) {
    const code = compId.trim().toUpperCase();
    if (!/^[A-Z0-9]{1,5}$/.test(code))
        throw new PdbError(`"${compId}" is not a PDB chemical component id`);
    const d = await request(`${DATA}/chemcomp/${code}`);
    const c = d?.chem_comp ?? {};
    const synonyms = (d?.rcsb_chem_comp_synonyms ?? []).map((s) => s.name).filter(Boolean);
    return [
        `${c.id ?? code} — ${c.name ?? "unnamed"}`,
        `Formula: ${c.formula ?? "?"} · weight ${c.formula_weight ? Number(c.formula_weight).toFixed(2) : "?"} Da`,
        `Type: ${c.type ?? "?"}`,
        synonyms.length ? `Synonyms: ${synonyms.slice(0, 10).join(", ")}` : "",
        `https://www.rcsb.org/ligand/${code}`,
    ]
        .filter(Boolean)
        .join("\n");
}
export async function structureCitation(id) {
    const e = await getEntry(id);
    const c = e.rcsb_primary_citation;
    if (!c)
        return `${pdbId(id)} has no primary citation on record.`;
    return [
        `Primary citation for ${pdbId(id)}:`,
        "",
        `${c.title ?? "untitled"}`,
        `${(c.rcsb_journal_abbrev ?? c.journal_abbrev ?? "journal unknown")}${c.year ? ` (${c.year})` : ""}${c.volume ? ` vol ${c.volume}` : ""}${c.page_first ? ` p${c.page_first}` : ""}`,
        (c.pdbx_database_id_DOI ?? c.pdbx_database_id_doi) ? `DOI: ${c.pdbx_database_id_DOI ?? c.pdbx_database_id_doi}` : "",
        (c.pdbx_database_id_PubMed ?? c.pdbx_database_id_pub_med)
            ? `PubMed: ${c.pdbx_database_id_PubMed ?? c.pdbx_database_id_pub_med}`
            : "",
        c.journal_volume ? `Volume: ${c.journal_volume}${c.page_first ? `, pages ${c.page_first}-${c.page_last ?? c.page_first}` : ""}` : "",
        Array.isArray(c.author) && c.author.length ? `Authors: ${c.author.slice(0, 8).join(", ")}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
