const BASE = 'https://datahub.io/core/country-codes/r/country-codes.csv';
function parseCsv(text) {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
        return [];
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const nameIdx = header.findIndex((h) => h.includes('common_name') || h === 'name');
    const officialIdx = header.findIndex((h) => h.includes('official_name'));
    const a2Idx = header.findIndex((h) => h === 'iso3166_1_alpha_2');
    const a3Idx = header.findIndex((h) => h === 'iso3166_1_alpha_3');
    const numIdx = header.findIndex((h) => h === 'iso3166_1_numeric');
    const regionIdx = header.findIndex((h) => h.includes('region') || h.includes('continent'));
    const rows = [];
    for (const line of lines.slice(1)) {
        // simple split respecting quoted fields
        const fields = [];
        let cur = '';
        let inQ = false;
        for (const ch of line) {
            if (ch === '"')
                inQ = !inQ;
            else if (ch === ',' && !inQ) {
                fields.push(cur);
                cur = '';
            }
            else
                cur += ch;
        }
        fields.push(cur);
        const pick = (idx) => (idx >= 0 ? fields[idx]?.trim() ?? '' : '');
        const name = pick(nameIdx) || pick(officialIdx);
        if (!name)
            continue;
        rows.push({
            name,
            official: pick(officialIdx),
            alpha2: pick(a2Idx).toLowerCase(),
            alpha3: pick(a3Idx).toLowerCase(),
            numeric: pick(numIdx),
            region: pick(regionIdx),
        });
    }
    return rows;
}
export async function list(args = {}) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-datahub-countries-mcp/1.0', Accept: 'text/csv' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`DataHub returned ${res.status}`);
    const rows = parseCsv(await res.text());
    if (!rows.length)
        return 'No country data available.';
    const q = (args.search ?? '').trim().toLowerCase();
    const limit = Math.max(1, Math.min(args.limit ?? 20, 100));
    const filtered = q
        ? rows.filter((r) => `${r.name} ${r.official} ${r.alpha2} ${r.alpha3}`.toLowerCase().includes(q))
        : rows;
    const shown = filtered.slice(0, limit);
    if (!shown.length)
        return `No countries match "${q}".`;
    return `Countries (${filtered.length} matched, ${shown.length} shown):\n` +
        shown
            .map((r, i) => `${i + 1}. ${r.name} (${r.alpha2}) ${r.alpha3 ? `| ${r.alpha3.toUpperCase()}` : ''}${r.region ? ` | ${r.region}` : ''}`)
            .join('\n');
}
function blank(value) {
    if (value == null)
        return true;
    const t = value.replace(/\u00a0/g, '').trim();
    return t === '' || t === '-' || t.toLowerCase() === 'nan';
}
function show(value) {
    if (blank(value))
        return 'not recorded';
    const t = String(value).replace(/\u00a0/g, ' ').trim();
    return t.length > 120 ? `${t.slice(0, 120)}...` : t;
}
function yesNo(value) {
    if (blank(value))
        return 'not recorded';
    const t = String(value).replace(/\u00a0/g, '').trim().toLowerCase();
    if (t === 'yes' || t === 'true')
        return 'yes';
    if (t === 'no' || t === 'false')
        return 'no';
    return show(value);
}
async function loadWide() {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-datahub-countries-mcp/1.0', Accept: 'text/csv' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`DataHub returned ${res.status}`);
    const lines = (await res.text()).split(/\r?\n/).filter((l) => l.trim());
    if (lines.length < 2)
        return [];
    const header = lines[0].split(',').map((h) => h.trim());
    const rows = [];
    for (const line of lines.slice(1)) {
        const fields = [];
        let cur = '';
        let inQ = false;
        for (const ch of line) {
            if (ch === '"')
                inQ = !inQ;
            else if (ch === ',' && !inQ) {
                fields.push(cur);
                cur = '';
            }
            else
                cur += ch;
        }
        fields.push(cur);
        const row = {};
        header.forEach((h, i) => {
            row[h] = (fields[i] ?? '').trim();
        });
        if (!blank(row['CLDR display name']))
            rows.push(row);
    }
    return rows;
}
function display(row) {
    return show(row['CLDR display name'] || row['official_name_en']);
}
const CODE_FIELDS = [
    ['ISO3166-1-Alpha-2', 'ISO alpha-2'],
    ['ISO3166-1-Alpha-3', 'ISO alpha-3'],
    ['ISO3166-1-numeric', 'ISO numeric'],
    ['M49', 'UN M49'],
    ['FIFA', 'FIFA'],
    ['Dial', 'calling code'],
    ['MARC', 'MARC'],
    ['FIPS', 'FIPS'],
    ['WMO', 'WMO'],
    ['ITU', 'ITU'],
    ['IOC', 'IOC'],
    ['TLD', 'TLD'],
    ['wikidata_id', 'Wikidata'],
    ['Geoname ID', 'Geonames'],
    ['ISO4217-currency_alphabetic_code', 'currency code'],
];
export async function regionSummary(args) {
    const level = (args.level ?? 'Region Name').trim();
    if (!['Region Name', 'Sub-region Name', 'Continent', 'Intermediate Region Name'].includes(level)) {
        return `Unknown level "${level}". Use Continent, Region Name, Intermediate Region Name or Sub-region Name.`;
    }
    const rows = await loadWide();
    if (!rows.length)
        throw new Error('DataHub returned no usable rows.');
    const groups = new Map();
    for (const r of rows) {
        const key = show(r[level]);
        const g = groups.get(key) ?? { total: 0, independent: 0, codes: [] };
        g.total += 1;
        if (String(r['is_independent'] ?? '').toLowerCase() === 'yes')
            g.independent += 1;
        const a2 = String(r['ISO3166-1-Alpha-2'] ?? '').replace(/\u00a0/g, '').trim();
        if (a2)
            g.codes.push(a2.toUpperCase());
        groups.set(key, g);
    }
    const ranked = [...groups.entries()].sort((a, b) => b[1].total - a[1].total);
    return [
        `Country code dataset grouped by ${level}: ${rows.length} entries in ${ranked.length} groups.`,
        ...ranked.map(([k, g], i) => `${i + 1}. ${k} | ${g.total} entries | ${g.independent} independent | codes ${g.codes.slice(0, 12).join(' ')}${g.codes.length > 12 ? ' ...' : ''}`),
    ].join('\n');
}
