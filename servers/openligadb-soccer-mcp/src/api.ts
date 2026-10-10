const BASE = 'https://api.openligadb.de';

export interface MatchesArgs {
  league?: string;
  season?: number;
}

export async function matches(args: MatchesArgs = {}): Promise<string> {
  const league = (args.league ?? 'bl1').trim();
  const season = args.season ?? new Date().getFullYear();
  const res = await fetch(`${BASE}/getmatchdata/${encodeURIComponent(league)}/${season}/1`, {
    headers: { 'User-Agent': 'mrfentmen-openligadb-soccer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`OpenLigaDB returned ${res.status}`);
  const rows = (await res.json()) as Array<Record<string, unknown>>;
  if (!Array.isArray(rows) || !rows.length) return `No match data for ${league} ${season}.`;
  return `${league.toUpperCase()} matchday 1, season ${season} (${rows.length} shown):\n` +
    rows
      .map((m, i) => {
        const teams = (m.teams ?? []) as Array<{ teamName?: string }>;
        const home = teams[0]?.teamName ?? 'home';
        const away = teams[1]?.teamName ?? 'away';
        const goals = (m.matchResults ?? []) as Array<{ pointsTeam1?: number; pointsTeam2?: number }>;
        const score = goals[0] ? `${goals[0].pointsTeam1}:${goals[0].pointsTeam2}` : 'vs';
        const date = m.matchDateTime ? String(m.matchDateTime).slice(0, 16).replace('T', ' ') : '';
        return `${i + 1}. ${home} ${score} ${away}${date ? ` | ${date}` : ''}`;
      })
      .join('\n');
}

// ---- muxB tools:

const LEAGUES = `${BASE}/getavailableleagues`;

export interface ScorersArgs {
  league?: string;
  season?: number;
  limit?: number;
}

export interface LeaguesArgs {
  limit?: number;
  sport?: string;
}

export async function leagues(args: LeaguesArgs = {}): Promise<string> {
  const limit = Math.max(1, Math.min(Number(args.limit ?? 20) || 20, 100));
  const sport = (args.sport ?? '').trim().toLowerCase();
  const res = await fetch(LEAGUES, {
    headers: { 'User-Agent': 'mrfentmen-openligadb-soccer-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  });
  if (!res.ok) throw new Error(`OpenLigaDB returned ${res.status}`);
  const rows = (await res.json()) as Array<{
    leagueName?: string;
    leagueShortcut?: string;
    leagueSeason?: string;
    sport?: { sportName?: string };
  }>;
  if (!Array.isArray(rows) || !rows.length) return 'No leagues reported.';
  const picked = sport ? rows.filter((r) => (r.sport?.sportName ?? '').toLowerCase().includes(sport)) : rows;
  if (!picked.length) return `No OpenLigaDB league reported for sport "${sport}".`;
  const shown = picked.slice(0, limit);
  return `OpenLigaDB leagues${sport ? ` matching "${sport}"` : ''} (${shown.length} of ${picked.length} shown):\n` +
    shown
      .map((r, i) => `${i + 1}. ${r.leagueShortcut ?? '?'} ${r.leagueSeason ?? '?'} — ${r.leagueName ?? '?'}${r.sport?.sportName ? ` [${r.sport.sportName}]` : ''}`)
      .join('\n');
}
