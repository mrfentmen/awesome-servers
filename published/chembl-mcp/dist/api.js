const BASE = "https://www.ebi.ac.uk/chembl/api/data";
const UA = "mrfentmen-chembl-mcp/1.0 (https://github.com/mrfentmen)";
export class ChemblError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new ChemblError(`ChEMBL returned HTTP ${res.status}`);
    return (await res.json());
}
export async function molecule(args) {
    const id = (args.id ?? "").trim().toUpperCase();
    if (!/^CHEMBL\d+$/.test(id))
        throw new ChemblError("Provide a molecule ID like CHEMBL25");
    const m = await get(`${BASE}/molecule/${encodeURIComponent(id)}.json`);
    const lines = [
        `Molecule: ${m?.pref_name ?? id}`,
        `ChEMBL ID: ${m?.molecule_chembl_id ?? id}`,
        `Formula: ${m?.molecule_properties?.full_molformula ?? "n/a"}`,
        `Molecular weight: ${m?.molecule_properties?.full_mwt != null ? Number(m.molecule_properties.full_mwt).toFixed(2) : "n/a"}`,
        `SMILES: ${m?.molecule_structures?.canonical_smiles ?? "n/a"}`,
    ];
    const indications = (m?.molecule_hierarchy ?? {});
    if (m?.molecule_synonyms?.length) {
        const syns = m.molecule_synonyms.slice(0, 5).map((s) => s?.molecule_synonym).filter(Boolean);
        if (syns.length)
            lines.push(`Synonyms: ${syns.join(", ")}`);
    }
    if (indications?.parent_chembl_id)
        lines.push(`Parent: ${indications.parent_chembl_id}`);
    return lines.join("\n");
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new ChemblError("Provide a name fragment");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/molecule.json?pref_name__icontains=${encodeURIComponent(q)}&limit=${limit}`);
    const mols = (d?.molecules ?? []);
    if (!mols.length)
        return `No ChEMBL molecules found for \"${q}\"`;
    return `ChEMBL molecules matching \"${q}\" (${d?.page_meta?.total_count ?? mols.length} total):\n` + mols.map((m, i) => {
        return `${i + 1}. ${m?.pref_name ?? "n/a"} | ${m?.molecule_chembl_id ?? ""} | ${m?.molecule_properties?.full_molformula ?? ""}`;
    }).join("\n");
}
// ---- muxA tools:
function molId(value) {
    return value != null ? String(value).trim().toUpperCase() : "";
}
function requireMol(value) {
    const id = molId(value);
    if (!/^CHEMBL\d+$/.test(id))
        throw new ChemblError("Provide a molecule ID like CHEMBL25");
    return id;
}
export async function moleculeMechanism(args) {
    const id = requireMol(args.molecule_id);
    const d = await get(`${BASE}/mechanism.json?molecule_chembl_id=${id}&limit=50`);
    const rows = (d?.mechanisms ?? []);
    if (!rows.length) {
        return `ChEMBL records no mechanism of action for ${id}. Not every ChEMBL entry has one; check molecule_indications for the trial data instead.`;
    }
    return [
        `${id} acts on ${rows.length} target(s) by mechanism.`,
        ...rows.map((m, i) => {
            const yes = (v) => (v === 1 || v === true ? "yes" : "no");
            return `${i + 1}. ${m?.mechanism_of_action ?? "mechanism not reported"} on ${m?.target_chembl_id ?? "target not reported"}` +
                `${m?.action_type ? ` | action ${m.action_type}` : ""}` +
                `${m?.max_phase != null ? ` | max trial phase ${m.max_phase}` : ""}` +
                `\n   direct interaction: ${yes(m?.direct_interaction)} | efficacy against disease: ${yes(m?.disease_efficacy)}` +
                `${m?.mechanism_comment ? `\n   comment: ${String(m.mechanism_comment).slice(0, 300)}` : ""}`;
        }),
    ].join("\n");
}
export async function chemblRelease(_args) {
    const d = await get(`${BASE}/status.json`);
    const n = (k) => (d?.[k] != null ? Number(d[k]).toLocaleString("en-US") : "not reported");
    return [
        `ChEMBL release ${d?.chembl_db_version ?? "version not reported"}, released ${d?.chembl_release_date ?? "date not reported"}`,
        `Service status: ${d?.status ?? "not reported"}`,
        `Activities: ${n("activities")}`,
        // the API spells this key "disinct_compounds", typo and all
        `Distinct compounds: ${n("disinct_compounds")}`,
        `Compound records: ${n("compound_records")}`,
        `Targets: ${n("targets")}`,
        `Publications: ${n("publications")}`,
        "The status resource reports only these six counts, so anything else is not counted here.",
    ].join("\n");
}
