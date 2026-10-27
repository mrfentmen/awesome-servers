const BASE = 'https://finalspaceapi.com/api/v0';
export async function characters(_args) {
    const res = await fetch(`${BASE}/character/`, {
        headers: { 'User-Agent': 'mrfentmen-finalspace-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Final Space returned ${res.status}`);
    const d = (await res.json());
    if (!d.length)
        return 'No characters returned.';
    return `Final Space characters (${d.length}):\n` +
        d.slice(0, 20).map((c, i) => {
            const s = (k) => (c[k] != null ? String(c[k]) : '');
            return `${i + 1}. ${s('name')} (${s('species')}) - ${s('status')}`;
        }).join('\n');
}
export async function character(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        return 'Provide a character id.';
    const res = await fetch(`${BASE}/character/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-finalspace-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Final Space returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const abilities = (d.abilities ?? []);
    return [
        `${s('name')} (${s('species')})`,
        `Status: ${s('status')} | Gender: ${s('gender')}`,
        `Origin: ${s('origin')}`,
        abilities.length ? `Abilities: ${abilities.slice(0, 5).join(', ')}` : '',
    ].filter(Boolean).join('\n');
}
// ---- muxF tools:
const SPACE_API = 'https://finalspaceapi.com/api/v0';
async function roster() {
    const res = await fetch(`${SPACE_API}/character/`, {
        headers: { 'User-Agent': 'mrfentmen-finalspace-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Final Space returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d) || !d.length)
        throw new Error('Final Space returned no characters.');
    return d;
}
function bound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
function field(c, key) {
    const value = c[key];
    return typeof value === 'string' && value.trim() ? value.trim() : 'not reported';
}
function tally(map, cap) {
    if (!map.size)
        return 'not reported';
    return [...map.entries()]
        .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
        .slice(0, cap)
        .map(([k, n]) => `${k} ${n}`)
        .join(', ');
}
/** The origin view of the cast: who comes from where and which abilities each origin brings with it. */
export async function originMap(args) {
    const rows = await roster();
    const limit = bound(args.limit, 1, 20, 10);
    const wanted = (args.origin ?? '').trim().toLowerCase();
    const origins = new Map();
    for (const c of rows) {
        const key = field(c, 'origin');
        const list = origins.get(key) ?? [];
        list.push(c);
        origins.set(key, list);
    }
    if (wanted) {
        const matches = [...origins.entries()].filter(([k]) => k.toLowerCase().includes(wanted));
        if (!matches.length) {
            const known = [...origins.keys()].sort().slice(0, 20);
            return `No character origin contains "${args.origin ?? wanted}". Origins the API records: ${known.join(', ')}.`;
        }
        for (const [origin, members] of matches) {
            const shared = new Map();
            for (const c of members)
                for (const a of c.abilities ?? [])
                    shared.set(a, (shared.get(a) ?? 0) + 1);
            const lines = [
                `Origin ${origin}: ${members.length} character(s)`,
                ...members.slice(0, limit).map((c) => {
                    const abilities = (c.abilities ?? []).slice(0, 4);
                    return `- ${field(c, 'name')} (id ${c.id ?? '?'}), ${field(c, 'species')}, ${field(c, 'status')}${abilities.length ? ` | abilities: ${abilities.join(', ')}` : ' | no abilities recorded'}`;
                }),
                members.length > limit ? `... and ${members.length - limit} more from this origin.` : '',
                `Abilities appearing in this origin: ${tally(shared, 10)}`,
            ];
            return lines.filter(Boolean).join('\n');
        }
    }
    const unknown = (origins.get('Unknown') ?? []).length;
    const lines = [
        `Origins across the ${rows.length} characters the API records: ${origins.size}`,
        `Characters with an origin the API does not name: ${unknown}`,
        ...[...origins.entries()]
            .sort((a, b) => b[1].length - a[1].length)
            .slice(0, limit)
            .map(([origin, members]) => {
            const abilities = new Set();
            for (const c of members)
                for (const a of c.abilities ?? [])
                    abilities.add(a);
            const alive = members.filter((c) => field(c, 'status') === 'Alive').length;
            return `- ${origin}: ${members.length} character(s), ${alive} alive, ${abilities.size} distinct abilit${abilities.size === 1 ? 'y' : 'ies'}`;
        }),
    ];
    return lines.join('\n');
}
