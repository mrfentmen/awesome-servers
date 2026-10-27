const BASE = 'https://www.fema.gov/api/open/v2/DisasterDeclarationsSummaries';
export async function declarations(args) {
    const state = (args.state ?? '').trim().toUpperCase();
    if (!state)
        return 'Provide a state code like CA or TX.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const url = `${BASE}?%24filter=state%20eq%20%27${state}%27&%24orderby=declarationDate%20desc&%24top=${limit}&%24format=json`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-fema-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`FEMA returned ${res.status}`);
    const data = (await res.json());
    const rows = data.DisasterDeclarationsSummaries ?? [];
    if (!rows.length)
        return `No FEMA disaster declarations found for ${state}.`;
    return `FEMA disaster declarations for ${state} (${data.metadata?.count ?? rows.length} total, ${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const date = r.declarationDate ? String(r.declarationDate).slice(0, 10) : '';
            return `${i + 1}. ${r.disasterType ?? ''} | ${r.incidentType ?? ''} | ${r.declarationTitle ?? 'untitled'}${date ? ` | ${date}` : ''}`;
        })
            .join('\n');
}
async function femaErrorMessage(res) {
    try {
        const body = (await res.json());
        const first = Array.isArray(body?.error) ? body.error[0] : body?.error;
        if (first?.message)
            return first.message;
    }
    catch {
        // the body was not the JSON error object, so the status is all we have
    }
    return `HTTP ${res.status}`;
}
async function getFema(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-fema-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new Error(await femaErrorMessage(res));
    const data = (await res.json());
    if (!data || typeof data !== 'object' || !('metadata' in data))
        throw new Error('FEMA returned an unexpected body.');
    return data;
}
export async function declarationTotals(args = {}) {
    const year = args.year === undefined ? undefined : Number(args.year);
    if (year !== undefined && (!Number.isInteger(year) || year < 1950 || year > 2100)) {
        throw new Error('Provide the fiscal year as a whole number between 1950 and 2100.');
    }
    const filter = year === undefined ? '' : `&%24filter=${encodeURIComponent(`fyDeclared eq ${year}`)}`;
    const counted = await getFema(`${BASE}?%24count=true&%24top=0${filter}&%24format=json`);
    const total = counted.metadata?.count;
    if (typeof total !== 'number')
        throw new Error('FEMA did not report a count.');
    const sample = await getFema(`${BASE}?%24top=100&%24select=${encodeURIComponent('state,incidentType,declarationType')}${filter}&%24format=json`);
    const rows = sample.DisasterDeclarationsSummaries ?? [];
    const states = new Set(rows.map((r) => r.state).filter(Boolean));
    const incidents = new Map();
    const types = new Map();
    for (const r of rows) {
        if (r.incidentType)
            incidents.set(r.incidentType, (incidents.get(r.incidentType) ?? 0) + 1);
        if (r.declarationType)
            types.set(r.declarationType, (types.get(r.declarationType) ?? 0) + 1);
    }
    const ranked = [...incidents.entries()].sort((a, b) => b[1] - a[1]);
    const lines = [
        year === undefined ? 'FEMA disaster declaration records' : `FEMA disaster declaration records declared in fiscal year ${year}`,
        `  records recorded by FEMA: ${total}`,
        `  this breakdown covers the first ${rows.length} of them, which FEMA returns in its own order:`,
        `    states represented: ${states.size}`,
    ];
    if (ranked.length) {
        lines.push('    incident types in that sample:');
        for (const [type, n] of ranked.slice(0, 10))
            lines.push(`      ${type}: ${n}`);
        if (ranked.length > 10)
            lines.push(`      and ${ranked.length - 10} more`);
    }
    else {
        lines.push('    incident types: none reported in that sample');
    }
    lines.push(`    declaration types: ${[...types.entries()].sort().map(([t, n]) => `${t} ${n}`).join(', ') || 'none reported'}`);
    lines.push('  the totals above are the real FEMA counts; the breakdown is a sample and is labelled as one.');
    return lines.join('\n');
}
