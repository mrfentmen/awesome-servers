const UA = 'mrfentmen-ebi-search-mcp/1.0';
const BASE = 'https://www.ebi.ac.uk/ebisearch/ws/rest';
export async function search(args) {
    const size = Math.min(Math.max(Number(args?.size ?? 5) || 5, 1), 20);
    const domain = args.domain || 'ensembl';
    const url = `${BASE}/${encodeURIComponent(domain)}?query=${encodeURIComponent(args.query)}&size=${size}&format=json`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`EBI Search returned ${res.status}`);
    const d = (await res.json());
    const entries = d.entries ?? [];
    if (!entries.length)
        return `No EBI results in "${domain}" for "${args.query}".`;
    const lines = entries.slice(0, size).map((e, i) => {
        const name = e.fields?.find((f) => f.name === 'name' || f.name === 'title')?.value ?? '';
        return `${i + 1}. ${e.id ?? '?'} ${name ? `- ${name.slice(0, 80)}` : ''}`;
    });
    return `EBI Search "${args.query}" in ${domain} (${d.hitCount ?? entries.length} hits):\n` + lines.join('\n');
}
export async function entry(args) {
    const url = `${BASE}/${encodeURIComponent(args.domain)}/entry/${encodeURIComponent(args.id)}?format=json`;
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`EBI Search returned ${res.status}`);
    const d = (await res.json());
    if (!d.id)
        throw new Error('No entry returned.');
    const fields = (d.fields ?? []).slice(0, 15).map((f) => `* ${f.name ?? '?'}: ${(f.value ?? '').slice(0, 120)}`);
    return `Entry ${d.id} (${d.source ?? args.domain}):\n` + fields.join('\n');
}
async function explainFailure(res) {
    let why = `HTTP ${res.status}`;
    try {
        const body = (await res.json());
        if (body?.diagnostics?.message)
            why = body.diagnostics.message;
    }
    catch {
        // the body was not JSON, so the status code is the only reason we have
        why = `HTTP ${res.status}`;
    }
    return why;
}
async function getEbi(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`EBI Search said ${await explainFailure(res)}`);
    return res.json();
}
export async function domainIndex(_args = {}) {
    const data = (await getEbi(`${BASE}?format=json`));
    const roots = data.domains ?? [];
    if (!roots.length)
        throw new Error('EBI Search returned no domains.');
    const nodes = [];
    const walk = (node, depth) => {
        const entry = { id: node.id, name: node.name ?? '', depth, descendants: 0 };
        nodes.push(entry);
        for (const child of node.subdomains ?? [])
            entry.descendants += 1 + walk(child, depth + 1);
        return entry.descendants;
    };
    for (const root of roots)
        walk(root, 0);
    const at = (depth) => nodes.filter((n) => n.depth === depth);
    const lines = [
        `EBI Search holds ${nodes.length} domains in one tree, ${nodes.length - roots.length} of them below the top level.`,
    ];
    for (const root of at(0))
        lines.push(`${root.id}${root.name ? ` (${root.name})` : ''}`);
    lines.push('  the groups directly below it:');
    for (const group of at(1)) {
        lines.push(`    ${group.id}${group.name ? ` (${group.name})` : ''}: ${group.descendants} domain(s) inside`);
    }
    const deepest = nodes.reduce((max, n) => Math.max(max, n.depth), 0);
    lines.push(`  the tree is ${deepest + 1} level(s) deep; pass any of these ids to the search or entry tool.`);
    return lines.join('\n');
}
