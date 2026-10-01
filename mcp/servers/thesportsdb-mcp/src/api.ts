const BASE = 'https://www.thesportsdb.com/api/v1/json/3';

export interface TeamArgs {
  query: string;
}

export interface LeagueArgs {
  id: number;
  limit?: number;
}

export async function team(args: TeamArgs): Promise<string> {
  const query = (args.query ?? '').trim();
  if (!query) return 'Provide a team name.';
  const res = await fetch(`${BASE}/searchteams.php?t=${encodeURIComponent(query)}`, {
    headers: { 'User-Agent': 'mrfentmen-thesportsdb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
  const d = (await res.json()) as { teams?: Array<Record<string, unknown>> };
  const teams = d.teams ?? [];
  if (!teams.length) return `No teams found for "${query}".`;
  return `Teams for "${query}" (${teams.length} shown):\n` +
    teams.slice(0, 5).map((t, i) => {
      const s = (k: string) => (t[k] != null ? String(t[k]) : '');
      return `${i + 1}. ${s('strTeam')} (${s('strSport')} - ${s('strLeague')}) | ${s('strTeamShort') ? s('strTeamShort') : 'n/a'}`;
    }).join('\n');
}

export async function league(args: LeagueArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) return 'Provide a league id.';
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/eventsnextleague.php?id=${id}`, {
    headers: { 'User-Agent': 'mrfentmen-thesportsdb-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
  const d = (await res.json()) as { events?: Array<Record<string, unknown>> };
  const events = d.events ?? [];
  if (!events.length) return `No upcoming events for league ${id}.`;
  return `Upcoming events (${Math.min(events.length, limit)} shown):\n` +
    events.slice(0, limit).map((e, i) => {
      const s = (k: string) => (e[k] != null ? String(e[k]) : '');
      return `${i + 1}. ${s('strHomeTeam')} vs ${s('strAwayTeam')} | ${s('strEventDate')} ${s('strTime')}`;
    }).join('\n');
}

// ---- muxB tools:

const UA_TSDB = 'mrfentmen-thesportsdb-mcp/1.0';

async function tsdbGet<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'User-Agent': UA_TSDB, Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`TheSportsDB returned ${res.status}`);
  return (await res.json()) as T;
}

const tsdbText = (row: Record<string, unknown>, key: string): string => {
  const value = row[key];
  return value != null && String(value) !== '' ? String(value) : 'not reported';
};

export interface LeagueTableArgs {
  id: number;
  limit?: number;
}

export interface LeagueTeamsArgs {
  league: string;
  limit?: number;
}

export interface PlayerArgs {
  id: number;
}

export async function player(args: PlayerArgs): Promise<string> {
  const id = Math.floor(args.id ?? 0);
  if (!id) throw new Error('Provide a player id.');
  const d = await tsdbGet<{ players?: Array<Record<string, unknown>> }>(`/lookupplayer.php?id=${id}`);
  const players = d.players ?? [];
  if (!players.length) return `No player found for id ${id}.`;
  const p = players[0];
  const rows: Array<[string, string]> = [
    ['Name', tsdbText(p, 'strPlayer')],
    ['Team', tsdbText(p, 'strTeam')],
    ['Position', tsdbText(p, 'strPosition')],
    ['Shirt number', tsdbText(p, 'strNumber')],
    ['Nationality', tsdbText(p, 'strNationality')],
    ['Born', tsdbText(p, 'dateBorn')],
    ['Birthplace', tsdbText(p, 'strBirthLocation')],
    ['Height', tsdbText(p, 'strHeight')],
    ['Weight', tsdbText(p, 'strWeight')],
    ['Status', tsdbText(p, 'strStatus')],
    ['SoccerXML team id', tsdbText(p, 'intSoccerXMLTeamID')],
  ];
  return [`Player ${id}`, ...rows.map(([label, value]) => `  ${label}: ${value}`)].join('\n');
}
