const BASE = 'https://api.congress.gov/v3/bill';
function apiKey() {
    return process.env.CONGRESS_API_KEY?.trim() || 'DEMO_KEY';
}
async function getBills(params) {
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-congress-gov-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Congress.gov returned ${res.status}`);
    const data = (await res.json());
    const rows = data.bills ?? [];
    if (!rows.length)
        return 'No bills returned.';
    return `Congress.gov bills (${data.pagination?.count ?? rows.length} total, ${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const num = r.number ? String(r.number).padStart(3, '0') : '';
            return `${i + 1}. ${r.type?.toUpperCase() ?? ''}${r.congress ? `${r.congress}` : ''}-${num} ${r.title ?? ''}${r.updateDate ? ` | ${String(r.updateDate).slice(0, 10)}` : ''}`;
        })
            .join('\n');
}
export async function bills(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json', limit: String(limit) });
    return getBills(params);
}
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json', limit: String(limit), query: q });
    return getBills(params);
}
async function getJson(path, limit) {
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json', limit: String(limit) });
    const res = await fetch(`https://api.congress.gov/v3${path}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-congress-gov-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Congress.gov returned ${res.status}`);
    return res.json();
}
export async function billDetails(args) {
    const congress = (args.congress ?? '118').trim();
    const type = (args.type ?? 'hr').trim().toLowerCase();
    const number = (args.number ?? '').trim();
    if (!number)
        return 'Provide a bill number.';
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json' });
    const res = await fetch(`${BASE}/${congress}/${type}/${number}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-congress-gov-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Congress.gov returned ${res.status}`);
    const d = (await res.json());
    const b = d.bill;
    if (!b)
        return 'Bill not found.';
    return `${b.type?.toUpperCase() ?? ''}${b.congress ?? ''}-${b.number ?? ''} ${b.title ?? ''}\nArea: ${b.policyArea?.name ?? 'n/a'}\nSponsors: ${(b.sponsors ?? []).slice(0, 3).map((s) => s.fullName).filter(Boolean).join(', ') || 'n/a'}\nLatest: ${b.latestAction?.actionDate ?? ''} ${b.latestAction?.text ?? ''}`.trim();
}
export async function billActions(args) {
    const congress = (args.congress ?? '118').trim();
    const type = (args.type ?? 'hr').trim().toLowerCase();
    const number = (args.number ?? '').trim();
    if (!number)
        return 'Provide a bill number.';
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json', limit: '10' });
    const res = await fetch(`${BASE}/${congress}/${type}/${number}/actions?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-congress-gov-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Congress.gov returned ${res.status}`);
    const d = (await res.json());
    const rows = d.actions ?? [];
    if (!rows.length)
        return 'No actions found.';
    return rows.slice(0, 10).map((a) => `${String(a.actionDate ?? '').slice(0, 10)}: ${a.text ?? ''}`).join('\n');
}
export async function members(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const d = (await getJson('/member', limit));
    const rows = d.members ?? [];
    if (!rows.length)
        return 'No members returned.';
    return rows.map((m, i) => `${i + 1}. ${m.name ?? ''} [${m.bioguideId ?? ''}]${m.partyName ? ` (${m.partyName})` : ''}${m.state ? ` ${m.state}` : ''}`).join('\n');
}
export async function memberDetails(args) {
    const id = (args.bioguideId ?? '').trim();
    if (!id)
        return 'Provide a Bioguide ID.';
    const params = new URLSearchParams({ api_key: apiKey(), format: 'json' });
    const res = await fetch(`https://api.congress.gov/v3/member/${encodeURIComponent(id)}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-congress-gov-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Congress.gov returned ${res.status}`);
    const d = (await res.json());
    const m = d.member;
    if (!m)
        return 'Member not found.';
    return `${m.directOrderName ?? id} (${m.party ?? ''} ${m.state ?? ''})\nTerms: ${(m.terms ?? []).slice(0, 5).map((t) => `${t.chamber ?? ''} ${t.startYear ?? ''}-${t.endYear ?? ''}`).join('; ') || 'n/a'}`;
}
export async function committees(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const d = (await getJson('/committee', limit));
    const rows = d.committees ?? [];
    if (!rows.length)
        return 'No committees returned.';
    return rows.map((c, i) => `${i + 1}. [${c.chamber ?? ''}] ${c.name ?? ''} (${c.committeeCode ?? ''})`).join('\n');
}
export async function committeeDetails(args) {
    const chamber = (args.chamber ?? 'house').trim().toLowerCase();
    const code = (args.code ?? '').trim().toLowerCase();
    if (!code)
        return 'Provide a committee code like agriculture.';
    const d = (await getJson(`/committee/${chamber}/${encodeURIComponent(code)}`, 1));
    const c = d.committee;
    if (!c)
        return 'Committee not found.';
    return `${c.name ?? ''} [${c.chamber ?? ''}]\nCode: ${c.committeeCode ?? ''}\n${c.url ?? ''}`;
}
export async function billSummaries(args) {
    const congress = (args.congress ?? '118').trim();
    const type = (args.type ?? 'hr').trim().toLowerCase();
    const number = (args.number ?? '').trim();
    if (!number)
        return 'Provide a bill number.';
    const d = (await getJson(`/bill/${congress}/${type}/${encodeURIComponent(number)}/summaries`, 5));
    const rows = d.summaries ?? [];
    if (!rows.length)
        return 'No summaries for this bill.';
    return rows.map((s, i) => `${i + 1}. (${String(s.updateDate ?? '').slice(0, 10)}) ${(s.text ?? '').slice(0, 400)}`).join('\n\n');
}
