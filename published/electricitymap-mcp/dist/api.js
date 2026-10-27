const UA = 'mrfentmen-electricitymap-mcp/1.0';
export async function zones(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
    const res = await fetch('https://api.electricitymap.org/v3/zones', {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Electricity Map returned ${res.status}`);
    const d = (await res.json());
    const keys = Object.keys(d ?? {});
    if (!keys.length)
        return 'No zones returned.';
    const header = `Electricity Map zones (${keys.length}, showing ${Math.min(limit, keys.length)}):`;
    return header + '\n' + keys.slice(0, limit).map((k, i) => {
        const z = d[k];
        return `${i + 1}. ${k} | ${z?.zoneName ?? '?'} | country: ${z?.countryCode ?? '?'}`;
    }).join('\n');
}
// ---- muxE tools:
// The one existing tool lists zones and prints three fields, capped at 50 of the
// 350 the service holds. Everything else the zones route carries is unused: a
// parent and sub-zone tree, a data tier and a commercial flag. The new tools
// answer the two questions that tree and those tiers raise. Every route other
// than /v3/zones needs an auth token this server does not have, verified live,
// so both new tools work from the one keyless payload.
const ZONES = "https://api.electricitymap.org/v3/zones";
const EM_UA = "mrfentmen-electricitymap-mcp/1.0";
async function getZones() {
    const res = await fetch(ZONES, {
        headers: { 'User-Agent': EM_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401)
        throw new Error('Electricity Map refused the request with 401; a valid auth token is needed for that route.');
    if (!res.ok)
        throw new Error(`Electricity Map returned ${res.status}`);
    const raw = await res.text();
    try {
        const parsed = JSON.parse(raw);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed))
            throw new Error('not a table');
        return parsed;
    }
    catch {
        throw new Error('Electricity Map returned a body that is not a zone table.');
    }
}
export async function zoneCatalogue(_args = {}) {
    const table = await getZones();
    const keys = Object.keys(table);
    if (!keys.length)
        return 'Electricity Map returned an empty zone table.';
    const tiers = new Map();
    let commercial = 0;
    let noTier = 0;
    const countries = new Set();
    for (const key of keys) {
        const record = table[key];
        if (record?.isCommerciallyAvailable === true)
            commercial += 1;
        if (record?.tier)
            tiers.set(record.tier, (tiers.get(record.tier) ?? 0) + 1);
        else
            noTier += 1;
        if (record?.countryCode)
            countries.add(record.countryCode);
    }
    const lines = [
        `Catalogue profile of the ${keys.length} Electricity Map zones:`,
        `  distinct country codes represented: ${countries.size}`,
        `  zones flagged commercially available: ${commercial} of ${keys.length}`,
        `  zones carrying no data tier: ${noTier}`,
        `  data tiers:`,
    ];
    for (const [tier, n] of [...tiers.entries()].sort((a, b) => b[1] - a[1])) {
        lines.push(`    ${tier}: ${n} zone(s)`);
    }
    const parents = keys.filter((k) => (table[k]?.subZoneKeys ?? []).length > 0);
    const subs = keys.filter((k) => Boolean(table[k]?.zoneParentKey));
    const leaves = keys.length - new Set([...parents, ...subs]).size;
    lines.push(`  top level zones: ${parents.length}`, `  sub-zones: ${subs.length}`, `  leaf zones: ${leaves}`);
    const untiered = keys.filter((k) => !table[k]?.tier);
    if (untiered.length) {
        lines.push(`  the ${untiered.length} zone(s) with no tier: ${untiered.slice(0, 25).join(", ")}${untiered.length > 25 ? `, and ${untiered.length - 25} more` : ""}`);
    }
    const biggest = [...parents].sort((a, b) => (table[b]?.subZoneKeys ?? []).length - (table[a]?.subZoneKeys ?? []).length).slice(0, 10);
    if (biggest.length) {
        lines.push('  the parent zones with the most sub-zones:');
        for (const key of biggest) {
            lines.push(`    ${key} ${table[key]?.zoneName ?? ''}: ${(table[key]?.subZoneKeys ?? []).length} sub-zone(s)`);
        }
    }
    const topTier = keys.filter((k) => table[k]?.tier === 'TIER_A');
    if (topTier.length) {
        lines.push(`  TIER_A zones, the highest data tier, number ${topTier.length} of ${keys.length}.`);
    }
    lines.push('  every count here is tallied from the live zone table, which is the only Electricity Map route this server can reach without an auth token.');
    return lines.join('\n');
}
