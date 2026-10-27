const BASE = 'https://api.open.fec.gov/v1/candidates';
function key() {
    return process.env.FEC_API_KEY?.trim() || 'DEMO_KEY';
}
async function fecGet(path, params) {
    const qs = new URLSearchParams({ api_key: key(), per_page: '5', ...params });
    const res = await fetch(`https://api.open.fec.gov/v1${path}?${qs.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-fec-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FEC returned ${res.status}`);
    return res.json();
}
export async function committees(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a committee name.';
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const data = (await fecGet('/committees/', { q, per_page: String(limit) }));
    const rows = data.results ?? [];
    if (!rows.length)
        return `No committees found for "${q}".`;
    return `FEC committees for "${q}" (${data.pagination?.count ?? rows.length} total):\n` +
        rows.map((r, i) => `${i + 1}. ${r.name ?? ''} [${r.committee_id ?? ''}]${r.committee_type_full ? ` | ${r.committee_type_full}` : ''}${r.state ? ` | ${r.state}` : ''}`).join('\n');
}
export async function filings(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = { per_page: String(limit) };
    if ((args.committeeId ?? '').trim())
        params.committee_id = args.committeeId.trim();
    const data = (await fecGet('/filings/', params));
    const rows = data.results ?? [];
    if (!rows.length)
        return 'No filings found.';
    return rows.map((r, i) => `${i + 1}. ${r.committee_id ?? ''} ${r.form_type ?? ''} ${r.report_year ?? ''} | in $${Number(r.total_receipts ?? 0).toLocaleString()} out $${Number(r.total_disbursements ?? 0).toLocaleString()}`).join('\n');
}
export async function scheduleA(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = { per_page: String(limit), two_year_transaction_period: (args.cycle ?? '2024').trim() };
    if ((args.committeeId ?? '').trim())
        params.committee_id = args.committeeId.trim();
    const data = (await fecGet('/schedules/schedule_a/', params));
    const rows = data.results ?? [];
    if (!rows.length)
        return 'No itemized receipts found.';
    return rows.map((r, i) => `${i + 1}. ${r.contributor_name ?? ''} $${Number(r.contribution_receipt_amount ?? 0).toLocaleString()} | ${r.receipt_type_full ?? ''}${r.state ? ` | ${r.state}` : ''}`).join('\n');
}
export async function scheduleB(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = { per_page: String(limit), two_year_transaction_period: (args.cycle ?? '2024').trim() };
    if ((args.committeeId ?? '').trim())
        params.committee_id = args.committeeId.trim();
    const data = (await fecGet('/schedules/schedule_b/', params));
    const rows = data.results ?? [];
    if (!rows.length)
        return 'No disbursements found.';
    return rows.map((r, i) => `${i + 1}. ${r.recipient_name ?? ''} $${Number(r.disbursement_amount ?? 0).toLocaleString()} | ${r.disbursement_description ?? ''}`).join('\n');
}
export async function candidateTotals(args) {
    const params = { two_year_transaction_period: (args.cycle ?? '2024').trim() };
    if ((args.candidateId ?? '').trim())
        params.candidate_id = args.candidateId.trim();
    const data = (await fecGet('/totals/by_candidate/', { ...params, per_page: '5' }));
    const rows = data.results ?? [];
    if (!rows.length)
        return 'No totals found.';
    return rows.map((r, i) => `${i + 1}. ${r.candidate_id ?? ''} | raised $${Number(r.receipts ?? 0).toLocaleString()} spent $${Number(r.disbursements ?? 0).toLocaleString()} cash $${Number(r.cash_on_hand_end_period ?? 0).toLocaleString()} debt $${Number(r.debts_owed ?? 0).toLocaleString()}`).join('\n');
}
export async function elections(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = { per_page: String(limit), cycle: (args.cycle ?? '2024').trim(), office: (args.office ?? 'president').trim().toLowerCase() };
    if ((args.state ?? '').trim())
        params.state = args.state.trim().toUpperCase();
    const data = (await fecGet('/elections/', params));
    const rows = data.results ?? [];
    if (!rows.length)
        return 'No election results found.';
    return rows.map((r, i) => `${i + 1}. ${r.candidate_name ?? ''}${r.party ? ` (${r.party})` : ''} raised $${Number(r.total_receipts ?? 0).toLocaleString()}${r.incumbent_challenge ? ` | ${r.incumbent_challenge}` : ''}`).join('\n');
}
export async function candidates(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide a candidate name.';
    const limit = Math.max(1, Math.min(args.limit ?? 5, 15));
    const params = new URLSearchParams({ api_key: 'DEMO_KEY', per_page: String(limit), q });
    const res = await fetch(`${BASE}/?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-fec-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`FEC returned ${res.status}`);
    const data = (await res.json());
    const rows = data.results ?? [];
    if (!rows.length)
        return `No candidates found for "${q}".`;
    return `FEC candidates for "${q}" (${data.pagination?.count ?? rows.length} total, ${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const office = r.office === 'H' ? 'House' : r.office === 'S' ? 'Senate' : r.office === 'P' ? 'President' : r.office ?? '';
            return `${i + 1}. ${r.name ?? ''}${r.party ? ` (${r.party})` : ''}${office ? ` | ${office}` : ''}${r.state ? ` | ${r.state}${r.district ? `-${r.district}` : ''}` : ''}`;
        })
            .join('\n');
}
