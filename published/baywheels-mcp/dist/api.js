const BASE = 'https://gbfs.baywheels.com/gbfs/en/station_information.json';
export async function stations(args = {}) {
    const res = await fetch(BASE, {
        headers: { 'User-Agent': 'mrfentmen-baywheels-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bay Wheels returned ${res.status}`);
    const data = (await res.json());
    const all = data.data?.stations ?? [];
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const shown = all.slice(0, limit);
    if (!shown.length)
        return 'No Bay Wheels stations available.';
    return `Bay Wheels stations (${all.length} total, ${shown.length} shown):\n` +
        shown
            .map((s, i) => `${i + 1}. ${s.name ?? 'unnamed'} | ${s.capacity ?? ''} docks | ${s.lat ?? ''}, ${s.lon ?? ''}`)
            .join('\n');
}
// ---- muxA tools:
// The existing tool lists stations from the static information feed. These add
// the live status feed joined to station detail, an availability rollup for the
// whole system or one region, and the system metadata (operator, regions, pricing).
const GBFS_ROOT = 'https://gbfs.lyft.com/gbfs/1.1/bay/en';
/** A station is treated as stale once its report is older than this. */
const STALE_SECONDS = 3600;
/** Dead stations carry last_reported 86400, the day after the epoch. */
const DEAD_SENTINEL = 86400;
async function feed(name) {
    const res = await fetch(`${GBFS_ROOT}/${name}.json`, {
        headers: { 'User-Agent': 'mrfentmen-baywheels-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Bay Wheels ${name} returned ${res.status}`);
    return (await res.json());
}
function reportAge(epoch) {
    if (!epoch || epoch === DEAD_SENTINEL)
        return null;
    return Math.floor(Date.now() / 1000) - epoch;
}
function ageText(epoch) {
    const age = reportAge(epoch);
    if (age === null)
        return 'no live report';
    if (age < 0)
        return 'just now';
    if (age < 60)
        return `${age}s ago`;
    if (age < 3600)
        return `${Math.floor(age / 60)}m ago`;
    if (age < 86400)
        return `${Math.floor(age / 3600)}h ago`;
    return `${Math.floor(age / 86400)}d ago`;
}
function isLive(state, maxAge) {
    const age = reportAge(state.last_reported);
    return age !== null && age <= maxAge;
}
function regionLabel(regions, id) {
    if (!id)
        return 'unassigned';
    const name = regions.get(id);
    return name ? `${name} (${id})` : `region ${id}`;
}
async function regionNames() {
    const feedData = await feed('system_regions');
    const regions = new Map();
    for (const r of feedData.data?.regions ?? []) {
        if (r.region_id)
            regions.set(r.region_id, r.name ?? `region ${r.region_id}`);
    }
    return regions;
}
export async function systemInfo(args = {}) {
    const [info, regions, planFeed] = await Promise.all([
        feed('system_information'),
        regionNames(),
        feed('system_pricing_plans'),
    ]);
    const sys = info.data;
    if (!sys)
        return 'Bay Wheels system information is unavailable right now.';
    const plans = planFeed.data?.plans ?? [];
    const planLimit = Math.max(1, Math.min(args.plansLimit ?? 10, 50));
    const lines = [
        `${sys.name ?? 'Bay Wheels'} — system id ${sys.system_id ?? '?'}`,
        `Operator: ${sys.operator ?? '?'} | Timezone: ${sys.timezone ?? '?'} | Live since: ${sys.start_date ?? 'not reported'}`,
        `Site: ${sys.url ?? '?'} | Passes: ${sys.purchase_url ?? '?'}`,
        `Regions: ${regions.size}`,
    ];
    for (const name of regions.values())
        lines.push(`  ${name}`);
    lines.push(`Pricing plans: ${plans.length}`);
    for (const p of plans.slice(0, planLimit)) {
        const price = p.currency ? `${p.price ?? '?'} ${p.currency}` : `${p.price ?? '?'}`;
        lines.push(`  ${p.name ?? p.plan_id ?? 'unnamed'} — ${price}${p.description ? ` | ${p.description}` : ''}`);
    }
    return lines.join('\n');
}
