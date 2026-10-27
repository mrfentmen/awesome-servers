/**
 * AlphaFold Protein Structure Database API client, keyless.
 * Docs: https://alphafold.ebi.ac.uk/api-docs
 * Find accessions with uniprot-mcp, then fetch predictions here.
 */
const BASE = "https://alphafold.ebi.ac.uk/api/prediction";
export class AlphaFoldError extends Error {
}
export async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "alphafold-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new AlphaFoldError("No AlphaFold prediction for this accession.");
    if (!res.ok)
        throw new AlphaFoldError(`AlphaFold error ${res.status}`);
    return (await res.json());
}
export async function getPrediction(accession) {
    const clean = accession.trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(clean)) {
        throw new AlphaFoldError(`Not a UniProt accession: "${accession}". Find one with uniprot-mcp first.`);
    }
    const rows = await getJson(`/${clean}`);
    return rows.slice(0, 5).map((r) => ({
        accession: clean,
        modelId: r.modelEntityId,
        tool: r.toolUsed ? String(r.toolUsed).split(" pipeline")[0] : undefined,
        plddt: typeof r.globalMetricValue === "number" ? r.globalMetricValue : undefined,
        lowConf: typeof r.fractionPlddtLow === "number" ? r.fractionPlddtLow : undefined,
        veryLowConf: typeof r.fractionPlddtVeryLow === "number" ? r.fractionPlddtVeryLow : undefined,
        created: r.modelCreatedDate ? String(r.modelCreatedDate).slice(0, 10) : undefined,
        sequenceDate: r.sequenceVersionDate ? String(r.sequenceVersionDate).slice(0, 10) : undefined,
    }));
}
export function modelFiles(accession, version = "v6") {
    const clean = accession.trim().toUpperCase();
    const base = `https://alphafold.ebi.ac.uk/files/AF-${clean}-F1-model_${version}`;
    return {
        cif: `${base}.cif`,
        pdb: `${base}.pdb`,
        pae: `${base}-predicted_aligned_error_v6.json`,
        page: `https://alphafold.ebi.ac.uk/entry/${clean}`,
    };
}
export function formatPrediction(p) {
    const lines = [
        `${p.accession}${p.modelId ? ` (${p.modelId})` : ""}`,
        p.tool ? `Pipeline: ${p.tool}` : "",
        p.plddt !== undefined ? `Mean pLDDT: ${p.plddt} (higher = more confident)` : "",
        p.lowConf !== undefined || p.veryLowConf !== undefined
            ? `Low-confidence fraction: ${p.lowConf ?? 0}% / very low: ${p.veryLowConf ?? 0}%`
            : "",
        p.created ? `Model date: ${p.created}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxE tools:
// get_prediction reads six of the forty-four fields the API returns and says
// nothing about which protein it is, how its confidence is distributed, or
// which model versions exist. model_files then guesses four URLs from a version
// string the caller supplies. These three read the fields that were left on the
// table and take the file URLs from the API rather than constructing them.
// This block is spliced into the same module, so Raw, AlphaFoldError and
// getJson are already in scope here and are not redeclared or imported again.
async function rows(accession) {
    const clean = (accession ?? "").trim().toUpperCase();
    if (!/^[A-Z0-9]{6,10}$/.test(clean)) {
        throw new AlphaFoldError(`Not a UniProt accession: "${accession}". Find one with uniprot-mcp first.`);
    }
    let data;
    try {
        data = await getJson(`/${clean}`);
    }
    catch (e) {
        // Verified against the live API: this route answers a 400 with the plain
        // body "Invalid identifier format" for anything that is not a UniProt
        // accession or a supported AlphaFold DB id, and getJson reduces that to a
        // bare status, so the status is turned back into the meaning it has here.
        if (e instanceof AlphaFoldError && /\berror 400\b/.test(e.message)) {
            throw new AlphaFoldError(`AlphaFold's route rejected "${clean}" as an invalid identifier. It wants a UniProt accession or a supported AlphaFold DB id. Find one with uniprot-mcp first.`);
        }
        throw e;
    }
    if (!Array.isArray(data) || !data.length)
        throw new AlphaFoldError("The AlphaFold API returned no rows for this accession.");
    return { clean, rows: data };
}
const asNumber = (v) => (typeof v === "number" && Number.isFinite(v) ? v : null);
const pct = (v) => {
    const n = asNumber(v);
    return n === null ? "unknown" : `${(n * 100).toFixed(1)}%`;
};
export async function proteinIdentity(args) {
    const { clean, rows: data } = await rows(args.accession);
    const first = data[0];
    const lines = [
        `What ${clean} is, straight from the AlphaFold record:`,
        `  description: ${first.uniprotDescription ?? "not given"}`,
        `  gene: ${first.gene ?? "not given"}`,
        `  organism: ${first.organismScientificName ?? "not given"}${first.taxId ? ` (taxId ${first.taxId})` : ""}`,
        `  UniProt status: ${first.isReviewed ? "reviewed" : "unreviewed"}${first.isReferenceProteome ? ", part of the reference proteome" : ", not in the reference proteome"}`,
    ];
    const seq = typeof first.sequence === "string" ? first.sequence.length : null;
    lines.push(`  sequence length modelled: ${seq ?? "unknown"} residues`);
    // A complex entry is several chains of several entities under one accession,
    // and a caller who has only seen the model id cannot tell which is which. The
    // record's own isComplex flag and the number of rows it returned are separate
    // facts, since an accession can return several models without being flagged
    // as a complex, so both are reported rather than one being inferred.
    lines.push(`  entry type: ${first.isComplex ? "flagged as a complex" : "flagged as a single entity"}` +
        (data.length > 1 ? `, and the API returned ${data.length} models for it` : ", with a single model returned"));
    if (data.length > 1) {
        lines.push(`  ${data.length} separate models came back, so any confidence figure has to be read per model and not averaged:`);
        for (const r of data) {
            lines.push(`    ${r.modelEntityId ?? "?"} chain ${r.chainId ?? "?"} residues ${r.sequenceStart ?? "?"}-${r.sequenceEnd ?? "?"}` +
                ` mean pLDDT ${asNumber(r.globalMetricValue)?.toFixed(2) ?? "?"} very high ${pct(r.fractionPlddtVeryHigh)}`);
        }
    }
    else if (first.chainId) {
        lines.push(`  chain: ${first.chainId}`);
    }
    const start = asNumber(first.sequenceStart);
    const end = asNumber(first.sequenceEnd);
    if (start !== null && end !== null) {
        const span = end - start + 1;
        lines.push(`  modelled residue range of the first model: ${start}-${end}, which is ${span} residue(s)`);
        if (seq && span !== seq)
            lines.push(`  note: that range is ${Math.abs(seq - span)} residue(s) ${seq > span ? "shorter" : "longer"} than the ${seq} residue sequence in the same record, so the model covers a fragment rather than the whole chain.`);
    }
    if (typeof first.sequenceChecksum === "string" && first.sequenceChecksum) {
        lines.push(`  sequence checksum: ${first.sequenceChecksum}, so two runs can be compared without holding either sequence`);
    }
    lines.push(`  modelled by: ${String(first.toolUsed ?? "unknown").replace(" pipeline", "")}, entity type ${first.entityType ?? "unknown"}`);
    return lines.join("\n");
}
export async function confidenceProfile(args) {
    const { clean, rows: data } = await rows(args.accession);
    const first = data[0];
    const plddt = asNumber(first.globalMetricValue);
    const veryHigh = asNumber(first.fractionPlddtVeryHigh);
    const high = asNumber(first.fractionPlddtHigh);
    const low = asNumber(first.fractionPlddtLow);
    const veryLow = asNumber(first.fractionPlddtVeryLow);
    const lines = [
        'Confidence profile for ' + clean + ' (' + (first.modelEntityId ?? 'unknown') + '):',
        '  Mean pLDDT: ' + (plddt !== null ? plddt.toFixed(2) : 'unknown'),
        '  Very high confidence (>90): ' + pct(veryHigh),
        '  Confident (70-90): ' + pct(high),
        '  Low (50-70): ' + pct(low),
        '  Very low (<50): ' + pct(veryLow),
        '',
        'Trustworthiness: ' + (veryHigh !== null && high !== null ? ((veryHigh + high) * 100).toFixed(1) + '% of residues are confident or better' : 'unknown'),
        'Uncertainty: ' + (low !== null && veryLow !== null ? ((low + veryLow) * 100).toFixed(1) + '% of residues have low confidence' : 'unknown'),
    ];
    if (data.length > 1) {
        lines.push('');
        lines.push('Note: ' + data.length + ' models returned. Showing first model only.');
    }
    return lines.join('\n');
}
export async function modelVersions(args) {
    const { clean, rows: data } = await rows(args.accession);
    const lines = ['AlphaFold model versions for ' + clean + ':', ''];
    for (const r of data) {
        const modelId = r.modelEntityId ?? 'unknown';
        const version = r.modelVersion ?? 'unknown';
        const files = r.fileUrls ?? {};
        lines.push('Model: ' + modelId + ' (version ' + version + ')');
        lines.push('  mmCIF: ' + (files.cif ?? 'not reported'));
        lines.push('  PDB: ' + (files.pdb ?? 'not reported'));
        lines.push('  BinaryCIF: ' + (files.bcif ?? 'not reported'));
        lines.push('  PAE JSON: ' + (files.pae ?? 'not reported'));
        lines.push('  pLDDT JSON: ' + (files.plddt ?? 'not reported'));
        lines.push('  MSA: ' + (files.msa ?? 'not reported'));
        lines.push('');
    }
    if (data.length === 1) {
        lines.push('Only one model version available.');
    }
    else {
        lines.push(data.length + ' model versions available.');
    }
    return lines.join('\n');
}
export async function paeSummary(args) {
    const { clean, rows: data } = await rows(args.accession);
    const modelIdx = args.model != null ? Math.max(0, Math.min(data.length - 1, args.model - 1)) : 0;
    const r = data[modelIdx];
    const paeUrl = r.fileUrls?.pae ?? r.paeUrl;
    if (!paeUrl)
        return 'No PAE file URL found for ' + clean + '.';
    const res = await fetch(paeUrl, { headers: { 'User-Agent': 'awesome-mcps/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(30000) });
    if (!res.ok)
        throw new AlphaFoldError('PAE fetch returned ' + res.status);
    const pae = (await res.json());
    const matrix = pae.predicted_aligned_error;
    if (!matrix || !matrix.length)
        return 'PAE file is empty or unreadable.';
    const n = matrix.length;
    let diagSum = 0, offDiagSum = 0, offDiagCount = 0;
    let maxPae = 0, maxI = 0, maxJ = 0;
    for (let i = 0; i < n; i++) {
        for (let j = 0; j < n; j++) {
            const val = matrix[i][j];
            if (i === j)
                diagSum += val;
            else {
                offDiagSum += val;
                offDiagCount++;
            }
            if (val > maxPae) {
                maxPae = val;
                maxI = i;
                maxJ = j;
            }
        }
    }
    const meanDiag = diagSum / n;
    const meanOffDiag = offDiagCount > 0 ? offDiagSum / offDiagCount : 0;
    const lines = [
        'PAE summary for ' + clean + ' (' + (r.modelEntityId ?? 'unknown') + '):',
        '  Matrix size: ' + n + ' x ' + n + ' residues',
        '  Mean PAE (diagonal): ' + meanDiag.toFixed(2) + ' (lower = more confident local structure)',
        '  Mean PAE (off-diagonal): ' + meanOffDiag.toFixed(2) + ' (lower = better relative positioning)',
        '  Max PAE: ' + maxPae.toFixed(2) + ' (between residues ' + (maxI + 1) + ' and ' + (maxJ + 1) + ')',
        '  Max PAE reported: ' + (pae.max_predicted_aligned_error ?? 'n/a'),
    ];
    return lines.join('\n');
}
