const BASE = 'https://sports.core.api.espn.com/v2';
const UA = 'mrfentmen-espn-core-mcp/1.0';
const SITE = 'https://site.api.espn.com/apis/site/v2/sports';
async function siteGet(path) {
    const res = await fetch(`${SITE}${path}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ESPN returned ${res.status}`);
    return res.json();
}
export async function scoreboard(args) {
    const sport = (args?.sport ?? 'football').trim().toLowerCase();
    const league = (args?.league ?? 'nfl').trim().toLowerCase();
    const d = await siteGet(`/${sport}/${league}/scoreboard`);
    const events = d.events ?? [];
    if (!events.length)
        return `No ${league.toUpperCase()} games on the board.`;
    return events.slice(0, 15).map((e) => {
        const comps = e.competitions?.[0]?.competitors ?? [];
        const home = comps.find((c) => c.homeAway === 'home');
        const away = comps.find((c) => c.homeAway === 'away');
        return `${e.name ?? '?'} (${String(e.date ?? '').slice(0, 10)}): ${away?.team?.abbreviation ?? '?'} ${away?.score ?? '-'} @ ${home?.team?.abbreviation ?? '?'} ${home?.score ?? '-'}`;
    }).join('\n');
}
export async function teamRoster(args) {
    const sport = (args?.sport ?? 'football').trim().toLowerCase();
    const league = (args?.league ?? 'nfl').trim().toLowerCase();
    const team = (args.team ?? '').trim();
    if (!team)
        return 'Provide a team id.';
    const d = await siteGet(`/${sport}/${league}/teams/${encodeURIComponent(team)}/roster`);
    const rows = [];
    for (const group of d.athletes ?? []) {
        for (const a of group.items ?? []) {
            rows.push(`${a.displayName ?? '?'} ${a.position?.abbreviation ?? ''} #${a.jersey ?? '?'}`);
        }
    }
    if (!rows.length)
        return 'No roster found.';
    return rows.slice(0, 30).map((r, i) => `${i + 1}. ${r}`).join('\n');
}
export async function leagueNews(args) {
    const sport = (args?.sport ?? 'football').trim().toLowerCase();
    const league = (args?.league ?? 'nfl').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
    const d = await siteGet(`/${sport}/${league}/news`);
    const rows = d.articles ?? [];
    if (!rows.length)
        return `No ${league.toUpperCase()} news.`;
    return rows.slice(0, limit).map((a, i) => `${i + 1}. ${a.headline ?? '?'} (${String(a.published ?? '').slice(0, 10)})`).join('\n');
}
export async function standings(args) {
    const sport = (args?.sport ?? 'football').trim().toLowerCase();
    const league = (args?.league ?? 'nfl').trim().toLowerCase();
    const d = await siteGet(`/${sport}/${league}/standings`);
    const groups = d.children ?? [];
    if (!groups.length)
        return d.fullViewLink?.href ? `Standings: ${d.fullViewLink.href}` : 'No standings.';
    return groups.map((g) => {
        const rows = (g.standings?.entries ?? []).slice(0, 8).map((e) => {
            const w = e.stats?.find((s) => s.name === 'wins')?.displayValue ?? '?';
            const l = e.stats?.find((s) => s.name === 'losses')?.displayValue ?? '?';
            return `  ${e.team?.abbreviation ?? '?'} ${w}-${l}`;
        }).join('\n');
        return `${g.name ?? 'Standings'}:\n${rows}`;
    }).join('\n');
}
export async function teams(args) {
    const sport = (args?.sport ?? 'football').trim().toLowerCase();
    const league = (args?.league ?? 'nfl').trim().toLowerCase();
    const limit = Math.min(Math.max(Number(args?.limit ?? 20) || 20, 1), 40);
    const res = await fetch(`${BASE}/sports/${sport}/leagues/${league}/teams?limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ESPN returned ${res.status}`);
    const d = (await res.json());
    const items = d.items ?? [];
    if (!items.length)
        return `No ${league.toUpperCase()} teams found.`;
    const rows = [];
    for (const item of items.slice(0, limit)) {
        const ref = item.$ref ?? '';
        const idMatch = ref.match(/\/(\d+)$/);
        rows.push(`${rows.length + 1}. Team id=${idMatch ? idMatch[1] : '?'} (ref: ${ref.slice(0, 90)})`);
    }
    return `ESPN ${league.toUpperCase()} teams (total ${d.count ?? items.length}, showing ${rows.length}):\n${rows.join('\n')}`;
}
export async function athletes(args) {
    const team = (args.team ?? '').trim();
    if (!team)
        return 'Provide a team ref id.';
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 30);
    const res = await fetch(`${BASE}/sports/football/leagues/nfl/teams/${encodeURIComponent(team)}/athletes?limit=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`ESPN returned ${res.status}`);
    const d = (await res.json());
    const items = d.items ?? [];
    if (!items.length)
        return 'No athletes found.';
    const rows = [];
    for (const item of items.slice(0, limit)) {
        const ref = item.$ref ?? '';
        const idMatch = ref.match(/\/(\d+)$/);
        rows.push(`${rows.length + 1}. Athlete id=${idMatch ? idMatch[1] : '?'}`);
    }
    return `ESPN athletes (total ${d.count ?? items.length}, showing ${rows.length}):\n${rows.join('\n')}`;
}
