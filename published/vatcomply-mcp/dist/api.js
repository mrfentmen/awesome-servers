const UA = 'mrfentmen-vatcomply-mcp/1.0';
export async function rates(_args) {
    const res = await fetch('https://api.vatcomply.com/rates', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`VATComply returned ${res.status}`);
    const d = (await res.json());
    const r = d.rates ?? {};
    const rows = Object.entries(r).map(([k, v]) => `${k}: ${v}`).join('\n');
    return `VATComply FX rates (base ${d.base ?? 'EUR'}, ${d.date ?? '?'}):\n${rows}`;
}
export async function country(args) {
    const code = (args.code ?? '').trim().toUpperCase();
    if (!code)
        return 'Provide an ISO country code like DE.';
    const res = await fetch(`https://api.vatcomply.com/rates?base=${encodeURIComponent(code)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`VATComply returned ${res.status}`);
    const d = (await res.json());
    return `VATComply rates for ${code} (${d.date ?? '?'}):\n` +
        Object.entries(d.rates ?? {}).map(([k, v]) => `${k}: ${v}`).join('\n');
}
// ---- muxB tools:
const VIES = 'https://ec.europa.eu/taxation_customs/vies/rest-api/ms';
const EU_MEMBERS = {
    AT: 'Austria',
    BE: 'Belgium',
    BG: 'Bulgaria',
    CY: 'Cyprus',
    CZ: 'Czechia',
    DE: 'Germany',
    DK: 'Denmark',
    EE: 'Estonia',
    EL: 'Greece',
    ES: 'Spain',
    FI: 'Finland',
    FR: 'France',
    HR: 'Croatia',
    HU: 'Hungary',
    IE: 'Ireland',
    IT: 'Italy',
    LT: 'Lithuania',
    LU: 'Luxembourg',
    LV: 'Latvia',
    MT: 'Malta',
    NL: 'Netherlands',
    PL: 'Poland',
    PT: 'Portugal',
    RO: 'Romania',
    SE: 'Sweden',
    SI: 'Slovenia',
    SK: 'Slovakia',
};
