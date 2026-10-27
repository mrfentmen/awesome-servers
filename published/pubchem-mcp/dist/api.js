const BASE = "https://pubchem.ncbi.nlm.nih.gov/rest";
const UA = "mrfentmen-pubchem-mcp/1.0 (https://github.com/mrfentmen)";
export class PubchemError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new PubchemError(`PubChem returned HTTP ${res.status} ${detail.slice(0, 80)}`);
    }
    return (await res.json());
}
export async function compound(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new PubchemError("Provide a compound name");
    const d = await get(`${BASE}/pug/compound/name/${encodeURIComponent(name)}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES,InChIKey/JSON`);
    const p = d?.PropertyTable?.Properties?.[0];
    if (!p)
        throw new PubchemError(`Compound not found: ${name}`);
    const lines = [
        `Name: ${p.IUPACName ?? name}`,
        `CID: ${p.CID ?? "n/a"}`,
        `Formula: ${p.MolecularFormula ?? "n/a"}`,
        `Molecular weight: ${p.MolecularWeight != null ? p.MolecularWeight : "n/a"}`,
        `SMILES: ${p.CanonicalSMILES ?? "n/a"}`,
        `InChIKey: ${p.InChIKey ?? "n/a"}`,
    ];
    return lines.join("\n");
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new PubchemError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/autocomplete/compound/${encodeURIComponent(q)}/json?limit=${limit}`);
    const terms = (d?.dictionary_terms?.compound ?? []);
    if (!terms.length)
        return "No matching compounds found";
    return terms.map((t, i) => `${i + 1}. ${t}`).join("\n");
}
export async function cidLookup(args) {
    const cid = (args.cid ?? "").trim();
    if (!/^\d+$/.test(cid))
        throw new PubchemError("Provide a numeric CID");
    const d = await get(`${BASE}/pug/compound/cid/${cid}/property/MolecularFormula,MolecularWeight,IUPACName,CanonicalSMILES/JSON`);
    const p = d?.PropertyTable?.Properties?.[0];
    if (!p)
        throw new PubchemError(`Compound not found: CID ${cid}`);
    return `CID: ${p.CID}\nName: ${p.IUPACName ?? "n/a"}\nFormula: ${p.MolecularFormula ?? "n/a"}\nWeight: ${p.MolecularWeight ?? "n/a"}\nSMILES: ${p.CanonicalSMILES ?? "n/a"}`;
}
export async function formulaSearch(args) {
    const f = (args.formula ?? "").trim();
    if (!f)
        throw new PubchemError("Provide a molecular formula like C9H8O4");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/pug/compound/formula/${encodeURIComponent(f)}/cids/JSON?MaxRecords=${limit}`);
    let cids = d?.IdentifierList?.CID ?? [];
    if (!cids.length && d?.Waiting?.ListKey) {
        await new Promise((r) => setTimeout(r, 3000));
        const w = await get(`${BASE}/pug/compound/listkey/${d.Waiting.ListKey}/cids/JSON?MaxRecords=${limit}`);
        cids = w?.IdentifierList?.CID ?? [];
    }
    if (!cids.length)
        return `No compounds with formula ${f}`;
    return `Compounds with formula ${f}:\n` + cids.slice(0, limit).map((c, i) => `${i + 1}. CID ${c}`).join("\n");
}
export async function synonyms(args) {
    const cid = (args.cid ?? "").trim();
    if (!/^\d+$/.test(cid))
        throw new PubchemError("Provide a numeric CID");
    const d = await get(`${BASE}/pug/compound/cid/${cid}/synonyms/JSON`);
    const syns = d?.InformationList?.Information?.[0]?.Synonym ?? [];
    if (!syns.length)
        return `No synonyms for CID ${cid}`;
    return `Synonyms for CID ${cid}:\n` + syns.slice(0, 20).join("\n");
}
export async function similar(args) {
    const smiles = (args.smiles ?? "").trim();
    if (!smiles)
        throw new PubchemError("Provide a SMILES string");
    const threshold = Math.min(Math.max(Number(args.threshold ?? 90) || 90, 60), 100);
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/pug/compound/fastsimilarity_2d/smiles/${encodeURIComponent(smiles)}/cids/JSON?Threshold=${threshold}&MaxRecords=${limit}`);
    const cids = d?.IdentifierList?.CID ?? [];
    if (!cids.length)
        return "No similar compounds found";
    return `Compounds similar to ${smiles} (Tanimoto >= ${threshold}):\n` + cids.slice(0, limit).map((c, i) => `${i + 1}. CID ${c}`).join("\n");
}
export async function substructure(args) {
    const smiles = (args.smiles ?? "").trim();
    if (!smiles)
        throw new PubchemError("Provide a SMILES pattern");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/pug/compound/substructure/smiles/${encodeURIComponent(smiles)}/cids/JSON?MaxRecords=${limit}`);
    const cids = d?.IdentifierList?.CID ?? [];
    if (!cids.length)
        return "No substructure matches found";
    return `Compounds containing ${smiles}:\n` + cids.slice(0, limit).map((c, i) => `${i + 1}. CID ${c}`).join("\n");
}
export async function assaySummary(args) {
    const aid = (args.aid ?? "").trim();
    if (!/^\d+$/.test(aid))
        throw new PubchemError("Provide a numeric assay AID");
    const d = await get(`${BASE}/pug/assay/aid/${aid}/summary/JSON`);
    const a = d?.AssaySummaries?.AssaySummary?.[0];
    if (!a)
        return `No assay found: AID ${aid}`;
    return `AID ${aid} | ${a.Name ?? "n/a"}\nSource: ${a.SourceName ?? "?"} | Protocol: ${(a.Protocol ?? "").slice(0, 200)}`;
}
