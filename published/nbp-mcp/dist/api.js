const BASE = 'https://api.nbp.pl/api';
const UA = 'mrfentmen-nbp-mcp/1.0 (https://github.com/mrfentmen)';
export class NbpError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new NbpError(`NBP returned ${res.status}`);
    return (await res.json());
}
export async function table(args) {
    const t = (args.table ?? 'A').toUpperCase();
    if (!['A', 'B', 'C'].includes(t))
        throw new NbpError('Table must be A, B, or C');
    const d = await get(`${BASE}/exchangerates/tables/${t}?format=json`);
    const row = d[0];
    if (!row)
        throw new NbpError('NBP returned no table');
    const rates = (row.rates ?? []);
    return `NBP table ${t} no. ${row.no ?? ''} (${row.effectiveDate ?? ''}):\n` +
        rates.map((r, i) => {
            const mid = r.mid != null ? `mid ${r.mid}` : `bid ${r.bid ?? '?'} / ask ${r.ask ?? '?'}`;
            return `${i + 1}. ${r.currency ?? '?'} (${r.code ?? '?'}): ${mid}`;
        }).join('\n');
}
export async function rates(args) {
    const code = (args.currency ?? '').trim().toUpperCase();
    if (!code)
        throw new NbpError('Provide a currency code like USD or EUR');
    const t = (args.table ?? 'A').toUpperCase();
    const d = await get(`${BASE}/exchangerates/rates/${t}/${code}?format=json`);
    const row = Array.isArray(d) ? d[0] : d;
    if (!row || !row.rates)
        throw new NbpError(`Currency ${code} not found`);
    const r = row.rates?.[0] ?? {};
    return `${row.currency ?? code} (${code}): ${r.mid != null ? `mid ${r.mid}` : `bid ${r.bid ?? '?'} / ask ${r.ask ?? '?'}`} as of ${r.effectiveDate ?? row.effectiveDate ?? '?'}`;
}
export async function gold(args) {
    const from = (args.from ?? '').trim();
    const to = (args.to ?? '').trim();
    let url = `${BASE}/cenyzlota?format=json`;
    if (from)
        url += `&startDate=${from}`;
    if (to)
        url += `&endDate=${to}`;
    const d = await get(url);
    if (!d.length)
        return 'No gold price data returned.';
    return `NBP gold price (${d.length} entries):\n` + d.slice(0, 15).map((g) => `${g.data ?? '?'}: ${g.cena ?? '?'} PLN/g`).join('\n');
}
// ---- muxC tools:
const NBP_UA = "mrfentmen-nbp-mcp/1.0 (https://github.com/mrfentmen)";
class NbpLookupError extends Error {
}
async function nbpGet(url) {
    const res = await fetch(url, { headers: { "User-Agent": NBP_UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new NbpError(`NBP returned ${res.status}`);
    return (await res.json());
}
