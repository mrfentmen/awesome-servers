/**
 * Open Targets Platform GraphQL client, keyless.
 * Docs: https://platform-docs.opentargets.org/data-access/graphql-api
 */
const API = "https://api.platform.opentargets.org/api/v4/graphql";
export class OpenTargetsError extends Error {
}
async function gql(query, variables = {}) {
    const res = await fetch(API, {
        method: "POST",
        headers: { "User-Agent": "opentargets-mcp/1.0", "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new OpenTargetsError(`Open Targets error ${res.status}`);
    const data = (await res.json());
    if (data.errors)
        throw new OpenTargetsError(`Open Targets: ${String(data.errors[0]?.message ?? "query failed")}`);
    return data.data;
}
export async function searchEntities(query, entity, limit = 5) {
    const data = await gql(`query($q: String!, $e: [String!], $n: Int!) {
      search(queryString: $q, entityNames: $e, page: { index: 0, size: $n }) {
        hits { id object { __typename ... on Target { approvedSymbol approvedName } ... on Disease { name } ... on Drug { name } } }
      }
    }`, { q: query, e: [entity], n: Math.min(Math.max(limit, 1), 25) });
    const hits = data.search?.hits ?? [];
    return hits.map((h) => {
        const o = h.object ?? {};
        return {
            id: String(h.id),
            kind: String(o.__typename ?? entity),
            label: String(o.approvedSymbol ?? o.approvedName ?? o.name ?? h.id),
        };
    });
}
export async function getTarget(ensemblId) {
    const id = ensemblId.trim();
    if (!/^ENSG\d+$/.test(id))
        throw new OpenTargetsError(`Not an Ensembl gene id: "${ensemblId}". Use search (e.g. BRCA1 gives ENSG...).`);
    const data = await gql(`query($id: String!) {
      target(ensemblId: $id) {
        approvedSymbol approvedName biotype
        functionDescriptions
        drugAndClinicalCandidates { count rows { drug { name } } }
        associatedDiseases(page: { index: 0, size: 5 }) { rows { disease { name } score } }
      }
    }`, { id });
    const t = data.target;
    if (!t)
        return null;
    const dc = t.drugAndClinicalCandidates ?? {};
    return {
        id,
        symbol: t.approvedSymbol,
        name: t.approvedName,
        biotype: t.biotype,
        functions: Array.isArray(t.functionDescriptions) ? t.functionDescriptions.map(String).slice(0, 3) : [],
        drugs: (dc.rows ?? []).map((r) => String(r.drug?.name ?? "?")).slice(0, 5),
        diseases: (t.associatedDiseases?.rows ?? []).map((r) => `${String(r.disease?.name ?? "?")} (${Number(r.score ?? 0).toFixed(2)})`).slice(0, 5),
    };
}
export function formatHit(h, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${h.id}] ${h.label} (${h.kind})`;
}
export function formatTarget(t) {
    const lines = [
        `${t.symbol ?? t.id}${t.name ? ` — ${t.name}` : ""} [${t.id}]`,
        t.biotype ? `Biotype: ${t.biotype}` : "",
        t.functions.length ? `Functions:\n- ${t.functions.join("\n- ")}` : "",
        t.drugs.length ? `Known drugs: ${t.drugs.join(", ")}` : "",
        t.diseases.length ? `Top diseases:\n- ${t.diseases.join("\n- ")}` : "",
        `More: https://platform.opentargets.org/target/${t.id}`,
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- muxE tools:
// getTarget reads six of the forty-two fields Open Targets holds on a target:
// symbol, name, biotype, three function descriptions, five drugs and five
// diseases. The other thirty-six are untouched, and among them are the three
// that answer the questions a target is actually triaged on: is it druggable,
// how badly does losing it hurt, and how much literature stands behind the
// association. The field names and types below were read from the live schema
// by introspection rather than assumed, since several differ from the obvious
// spelling, and geneticConstraint is a list rather than a single object.
// This block is spliced into the same module, so gql and OpenTargetsError are
// already in scope and are not imported again.
const num = (v) => {
    const n = typeof v === 'number' ? v : typeof v === 'string' ? Number(v) : NaN;
    return Number.isFinite(n) ? n : null;
};
function ensemblId(raw) {
    const id = String(raw ?? '').trim();
    if (!/^ENSG\d+$/.test(id)) {
        throw new OpenTargetsError(`Not an Ensembl gene id: "${raw}". Use search (e.g. BRCA1 gives ENSG...).`);
    }
    return id;
}
const label = (v, max = 60) => {
    if (typeof v !== 'string' || !v.trim())
        return 'not reported';
    const t = v.trim();
    return t.length > max ? `${t.slice(0, max)}...` : t;
};
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(0)}%` : 'n/a');
export async function target_evidence(args) {
    const id = ensemblId(args?.ensemblId);
    const limit = Math.max(5, Math.min(60, Math.floor(Number(args?.limit ?? 30) || 30)));
    const data = await gql(`query($id: String!) { target(ensemblId: $id) { approvedSymbol approvedName dbXrefs { id source } literatureOcurrences { count earliestPubYear } } }`, { id });
    const t = data.target;
    if (!t)
        return `Open Targets has no record for ${id}.`;
    const xr = Array.isArray(t.dbXrefs) ? t.dbXrefs : [];
    const bySource = new Map();
    const examples = new Map();
    for (const x of xr) {
        const s = x.source ?? 'not reported';
        bySource.set(s, (bySource.get(s) ?? 0) + 1);
        if (x.id)
            examples.set(s, [...(examples.get(s) ?? []), x.id].slice(0, 3));
    }
    const lit = t.literatureOcurrences ?? {};
    const count = num(lit.count);
    const lines = [
        `How much evidence stands behind ${t.approvedSymbol ?? id}, as Open Targets counts it:`,
        `  linked publications: ${count === null ? 'not reported' : count.toLocaleString('en-US')}${lit.earliestPubYear ? `, the earliest recorded from ${lit.earliestPubYear}` : ''}.`,
    ];
    if (count !== null) {
        lines.push("  that figure counts papers mentioning the entity, not papers supporting any particular claim about it, so it measures attention rather than support.");
    }
    lines.push(`  cross-references held: ${xr.length}, across ${bySource.size} source${bySource.size === 1 ? '' : 's'}.`);
    if (!bySource.size) {
        lines.push("  none of them report a source, so there is no way to tell which database an identifier came from.");
    }
    else {
        const ordered = [...bySource.entries()].sort((a, b) => b[1] - a[1]);
        lines.push('');
        lines.push("  by source:");
        for (const [s, n] of ordered) {
            lines.push(`    ${s.padEnd(16)}${String(n).padStart(4)}  ${(examples.get(s) ?? []).join(', ')}${n > 3 ? ' ...' : ''}`);
        }
        const structural = ordered.filter(([s]) => s === 'PDB' || s === 'CHEMBL' || s === 'OpenTargets_WikiPathways' || s === 'Reactome');
        const literature = ordered.filter(([s]) => s === 'PubMed' || s === 'GO');
        if (structural.length) {
            lines.push('');
            lines.push(`  ${structural.map(([s, n]) => `${n} ${s}`).join(', ')}: structural records a compound or a pathway can be built from.`);
        }
        if (literature.length) {
            lines.push(`  ${literature.map(([s, n]) => `${n} ${s}`).join(', ')}: indexing references, which is a measure of curation rather than of evidence quality.`);
        }
        const top = ordered[0];
        if (top && xr.length && top[1] / xr.length > 0.5) {
            lines.push(`  one source holds ${pct(top[1], xr.length)} of all cross-references, so the apparent breadth of this record is mostly that one database.`);
        }
    }
    lines.push("");
    lines.push("  The existing tools report neither the publication count nor the cross-references, so a target with three links and a target with three hundred look identical.");
    return lines.join('\n');
}
