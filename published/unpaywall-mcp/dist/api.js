const BASE = 'https://api.unpaywall.org/v2';
export async function oa(args) {
    const doi = (args.doi ?? '').trim();
    const email = (args.email ?? '').trim() || 'mrfentmen@gmail.com';
    if (!doi)
        return 'Provide a DOI.';
    const res = await fetch(`${BASE}/${encodeURIComponent(doi)}?email=${encodeURIComponent(email)}`, {
        headers: { 'User-Agent': 'mrfentmen-unpaywall-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Unpaywall returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const oaLoc = (d.best_oa_location ?? {});
    const locS = (k) => (oaLoc[k] != null ? String(oaLoc[k]) : '');
    return [
        `DOI: ${s('doi')}`,
        s('title') ? `Title: ${s('title').slice(0, 150)}` : '',
        `Open access: ${s('is_oa')} | Status: ${s('oa_status')}`,
        locS('url') ? `Best OA: ${locS('url')}` : 'No open access location found.',
    ].filter(Boolean).join('\n');
}
// ---- muxC tools:
