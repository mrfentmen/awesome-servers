const BASE = 'https://sports.core.api.espn.com/v2';
const UA = 'mrfentmen-espn-core-mcp/1.0';

export interface TeamsArgs {
  sport?: string;
  league?: string;
  limit?: number;
}

export interface AthletesArgs {
  team: string;
  limit?: number;
}

const SITE = 'https://site.api.espn.com/apis/site/v2/sports';

async function siteGet(path: string): Promise<any> {
  const res = await fetch(`${SITE}${path}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  return res.json();
}

export interface LeagueArgs {
  sport?: string;
  league?: string;
  limit?: number;
}

export async function scoreboard(args: LeagueArgs): Promise<string> {
  const sport = (args?.sport ?? 'football').trim().toLowerCase();
  const league = (args?.league ?? 'nfl').trim().toLowerCase();
  const d = await siteGet(`/${sport}/${league}/scoreboard`) as { events?: Array<{ name?: string; date?: string; competitions?: Array<{ competitors?: Array<{ homeAway?: string; team?: { abbreviation?: string }; score?: string }> }> }> };
  const events = d.events ?? [];
  if (!events.length) return `No ${league.toUpperCase()} games on the board.`;
  return events.slice(0, 15).map((e) => {
    const comps = e.competitions?.[0]?.competitors ?? [];
    const home = comps.find((c) => c.homeAway === 'home');
    const away = comps.find((c) => c.homeAway === 'away');
    return `${e.name ?? '?'} (${String(e.date ?? '').slice(0, 10)}): ${away?.team?.abbreviation ?? '?'} ${away?.score ?? '-'} @ ${home?.team?.abbreviation ?? '?'} ${home?.score ?? '-'}`;
  }).join('\n');
}

export interface RosterArgs {
  sport?: string;
  league?: string;
  team: string;
}

export async function teamRoster(args: RosterArgs): Promise<string> {
  const sport = (args?.sport ?? 'football').trim().toLowerCase();
  const league = (args?.league ?? 'nfl').trim().toLowerCase();
  const team = (args.team ?? '').trim();
  if (!team) return 'Provide a team id.';
  const d = await siteGet(`/${sport}/${league}/teams/${encodeURIComponent(team)}/roster`) as { athletes?: Array<{ position?: string; items?: Array<{ displayName?: string; position?: { abbreviation?: string }; jersey?: string }> }> };
  const rows: string[] = [];
  for (const group of d.athletes ?? []) {
    for (const a of group.items ?? []) {
      rows.push(`${a.displayName ?? '?'} ${a.position?.abbreviation ?? ''} #${a.jersey ?? '?'}`);
    }
  }
  if (!rows.length) return 'No roster found.';
  return rows.slice(0, 30).map((r, i) => `${i + 1}. ${r}`).join('\n');
}

export async function leagueNews(args: LeagueArgs): Promise<string> {
  const sport = (args?.sport ?? 'football').trim().toLowerCase();
  const league = (args?.league ?? 'nfl').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 25);
  const d = await siteGet(`/${sport}/${league}/news`) as { articles?: Array<{ headline?: string; published?: string }> };
  const rows = d.articles ?? [];
  if (!rows.length) return `No ${league.toUpperCase()} news.`;
  return rows.slice(0, limit).map((a, i) => `${i + 1}. ${a.headline ?? '?'} (${String(a.published ?? '').slice(0, 10)})`).join('\n');
}

export async function standings(args: LeagueArgs): Promise<string> {
  const sport = (args?.sport ?? 'football').trim().toLowerCase();
  const league = (args?.league ?? 'nfl').trim().toLowerCase();
  const d = await siteGet(`/${sport}/${league}/standings`) as { fullViewLink?: { href?: string }; children?: Array<{ name?: string; standings?: { entries?: Array<{ team?: { abbreviation?: string }; stats?: Array<{ name?: string; value?: number; displayValue?: string }> }> } }> };
  const groups = d.children ?? [];
  if (!groups.length) return d.fullViewLink?.href ? `Standings: ${d.fullViewLink.href}` : 'No standings.';
  return groups.map((g) => {
    const rows = (g.standings?.entries ?? []).slice(0, 8).map((e) => {
      const w = e.stats?.find((s) => s.name === 'wins')?.displayValue ?? '?';
      const l = e.stats?.find((s) => s.name === 'losses')?.displayValue ?? '?';
      return `  ${e.team?.abbreviation ?? '?'} ${w}-${l}`;
    }).join('\n');
    return `${g.name ?? 'Standings'}:\n${rows}`;
  }).join('\n');
}

export async function teams(args: TeamsArgs): Promise<string> {
  const sport = (args?.sport ?? 'football').trim().toLowerCase();
  const league = (args?.league ?? 'nfl').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(args?.limit ?? 20) || 20, 1), 40);
  const res = await fetch(`${BASE}/sports/${sport}/leagues/${league}/teams?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  const d = (await res.json()) as { count?: number; items?: Array<{ $ref?: string }> };
  const items = d.items ?? [];
  if (!items.length) return `No ${league.toUpperCase()} teams found.`;
  const rows: string[] = [];
  for (const item of items.slice(0, limit)) {
    const ref = item.$ref ?? '';
    const idMatch = ref.match(/\/(\d+)$/);
    rows.push(`${rows.length + 1}. Team id=${idMatch ? idMatch[1] : '?'} (ref: ${ref.slice(0, 90)})`);
  }
  return `ESPN ${league.toUpperCase()} teams (total ${d.count ?? items.length}, showing ${rows.length}):\n${rows.join('\n')}`;
}

export async function athletes(args: AthletesArgs): Promise<string> {
  const team = (args.team ?? '').trim();
  if (!team) return 'Provide a team ref id.';
  const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 30);
  const res = await fetch(`${BASE}/sports/football/leagues/nfl/teams/${encodeURIComponent(team)}/athletes?limit=${limit}`, {
    headers: { 'User-Agent': UA, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`ESPN returned ${res.status}`);
  const d = (await res.json()) as { count?: number; items?: Array<{ $ref?: string }> };
  const items = d.items ?? [];
  if (!items.length) return 'No athletes found.';
  const rows: string[] = [];
  for (const item of items.slice(0, limit)) {
    const ref = item.$ref ?? '';
    const idMatch = ref.match(/\/(\d+)$/);
    rows.push(`${rows.length + 1}. Athlete id=${idMatch ? idMatch[1] : '?'}`);
  }
  return `ESPN athletes (total ${d.count ?? items.length}, showing ${rows.length}):\n${rows.join('\n')}`;
}
