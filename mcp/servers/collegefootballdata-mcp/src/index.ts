#!/usr/bin/env node
/**
 * collegefootballdata-mcp - college football data through the CFBD API.
 *
 * Twenty tools over api.collegefootballdata.com, one free Bearer key:
 * conferences, venues, teams, games, scoreboard, team game stats, betting
 * lines, game weather, rankings polls, player game stats, team season stats,
 * advanced game stats, player search, player season stats, recruiting
 * (players + teams), coaches, SP+ and SRS ratings, and the season calendar.
 *
 * Every tool is one real GET; nothing here writes or moves anything. The
 * key is read from COLLEGEFOOTBALLDATA_API_KEY.
 *
 * First-party MCP coverage check (2026-10-23): no CFBD MCP on npm and no
 * first-party server from the CollegeFootballData project. See mcp/MISSING.md.
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { cfbdGet } from './api.js';
import {
  optionalText,
  pollTop,
  requireText,
  summarizeGames,
  validateSeasonType,
  validateWeek,
  validateYear,
  type QueryParams,
} from './util.js';

const server = new Server(
  { name: 'collegefootballdata-mcp', version: '0.1.0' },
  { capabilities: { tools: {} } },
);

interface ParamDef {
  key: string;
  type: 'integer' | 'string';
  description: string;
  required?: boolean;
}

const YEAR: ParamDef = { key: 'year', type: 'integer', description: 'season year (e.g. 2025)', required: true };
const YEAR_OPT: ParamDef = { key: 'year', type: 'integer', description: 'season year' };
const WEEK: ParamDef = { key: 'week', type: 'integer', description: 'week of the season (1-25)' };
const SEASON_TYPE: ParamDef = { key: 'seasonType', type: 'string', description: 'regular | postseason | both' };
const TEAM: ParamDef = { key: 'team', type: 'string', description: 'team name, e.g. "Michigan"' };
const CONF: ParamDef = { key: 'conference', type: 'string', description: 'conference abbreviation, e.g. "SEC"' };

interface Endpoint {
  path: string;
  description: string;
  params: ParamDef[];
}

const ENDPOINTS: Record<string, Endpoint> = {
  cfbd_conferences: { path: '/conferences', description: 'List every FBS/FCS conference with its full name and abbreviation.', params: [] },
  cfbd_venues: { path: '/venues', description: 'List college football venues with capacity, city, state, elevation and surface.', params: [] },
  cfbd_teams: { path: '/teams', description: 'List teams with colors, logos, mascot, conference and division.', params: [CONF] },
  cfbd_games: {
    path: '/games',
    description: 'Games for a season/week with scores, venue and start time. Returns compact rows.',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_scoreboard: {
    path: '/scoreboard',
    description: 'Live scoreboard for a week (useful for games in progress; no year needed means the current slate).',
    params: [WEEK, SEASON_TYPE, YEAR_OPT, TEAM, CONF],
  },
  cfbd_game_team_stats: {
    path: '/games/teams',
    description: 'Per-team box score stats for games in a season/week (total yards, turnovers, ...).',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_betting_lines: {
    path: '/games/lines',
    description: 'Betting lines for games: spread, over/under and moneylines from several books.',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_game_weather: {
    path: '/games/weather',
    description: 'Forecasted weather for games in a season/week.',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_rankings: {
    path: '/rankings',
    description: 'Polls for a season/week (AP Top 25, Coaches, CFP Rankings, ...). Optional poll filter and top_n slice.',
    params: [YEAR, WEEK, SEASON_TYPE],
  },
  cfbd_player_game_stats: {
    path: '/games/players',
    description: 'Per-player game statistics for a season/week, optionally per team or conference.',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_team_season_stats: {
    path: '/stats/season/total',
    description: 'Full team season totals by stat category for a year, optionally one team or conference.',
    params: [YEAR, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_advanced_game_stats: {
    path: '/stats/game/advanced',
    description: 'Advanced (per-game) team efficiency stats for a season/week, optionally per team.',
    params: [YEAR, WEEK, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_player_search: {
    path: '/players',
    description: 'Find players by name fragment across all seasons, with team, position and years.',
    params: [{ key: 'searchTerm', type: 'string', description: 'part of the player name', required: true }, TEAM, YEAR_OPT],
  },
  cfbd_player_season_stats: {
    path: '/players/stats',
    description: 'Player season stats filtered by category (passing, rushing, receiving, defensive, ...).',
    params: [YEAR, SEASON_TYPE, TEAM, CONF],
  },
  cfbd_recruiting_players: {
    path: '/recruiting/players',
    description: 'Recruited players for a year with stars, position, ranking, rating and committed school.',
    params: [YEAR, TEAM, CONF],
  },
  cfbd_recruiting_teams: {
    path: '/recruiting/teams',
    description: 'Team recruiting rankings for a year: points, average rating, commits.',
    params: [YEAR, TEAM, CONF],
  },
  cfbd_coaches: {
    path: '/coaches',
    description: 'Coaches with their full career stints; filter by team or name fragment.',
    params: [TEAM, { key: 'firstName', type: 'string', description: 'coach first name' }, { key: 'lastName', type: 'string', description: 'coach last name' }, YEAR_OPT],
  },
  cfbd_sp_plus_ratings: {
    path: '/metrics/sp+',
    description: 'Bill Connelly SP+ team ratings for a year (offense/defense/special teams).',
    params: [YEAR, TEAM, CONF],
  },
  cfbd_srs_ratings: {
    path: '/metrics/srs',
    description: 'Simple Rating System (SRS) team ratings for a year.',
    params: [YEAR, TEAM, CONF],
  },
  cfbd_season_calendar: {
    path: '/calendar',
    description: 'The season calendar: which weeks carry regular vs postseason games.',
    params: [{ key: 'year', type: 'integer', description: 'season year', required: true }],
  },
};

function argSchema(params: ParamDef[]): Record<string, unknown> {
  const properties: Record<string, unknown> = {};
  const required: string[] = [];
  for (const p of params) {
    properties[p.key] = { type: p.type, description: p.description };
    if (p.required) required.push(p.key);
  }
  return { type: 'object', properties, ...(required.length ? { required } : {}), additionalProperties: false };
}

const RANKINGS_EXTRAS = {
  poll: { type: 'string', description: 'poll name fragment, e.g. "AP" or "Playoff Committee"' },
  top_n: { type: 'integer', minimum: 1, maximum: 25, description: 'keep only the first N ranked rows per week' },
};

const TOOLS = Object.entries(ENDPOINTS).map(([name, ep]) => {
  const properties =
    name === 'cfbd_rankings'
      ? { ...argSchema(ep.params).properties, ...RANKINGS_EXTRAS }
      : argSchema(ep.params).properties;
  return {
    name,
    description: ep.description,
    inputSchema: { type: 'object', properties, additionalProperties: false },
  };
});

function collect(args: Record<string, unknown> | undefined, params: ParamDef[]): QueryParams {
  const out: QueryParams = {};
  for (const p of params) {
    const v = args?.[p.key];
    if (v == null || v === '') continue;
    if (p.key === 'year') out.year = validateYear(v, false);
    else if (p.key === 'week') out.week = validateWeek(v);
    else if (p.key === 'seasonType') out.seasonType = validateSeasonType(v);
    else if (p.type === 'string') out[p.key] = optionalText(v, p.key) ?? '';
    else out[p.key] = v;
  }
  return out;
}

server.setRequestHandler(ListToolsRequestSchema, async () => ({ tools: TOOLS }));

server.setRequestHandler(CallToolRequestSchema, async (req) => {
  const { name, arguments: args } = req.params as { name: string; arguments?: Record<string, unknown> };
  const json = (data: unknown) => ({ content: [{ type: 'text', text: JSON.stringify(data, null, 2) }] });
  const fail = (err: unknown) => ({
    isError: true,
    content: [{ type: 'text', text: `Error: ${err instanceof Error ? err.message : String(err)}` }],
  });
  try {
    const ep = ENDPOINTS[name];
    if (!ep) return fail(new Error(`unknown tool: ${name}`));
    // tools that need a text argument the schema marks required
    if (name === 'cfbd_player_search') requireText(args?.searchTerm, 'searchTerm');

    let data = await cfbdGet(ep.path, collect(args, ep.params));
    if (name === 'cfbd_games') data = summarizeGames(data);
    if (name === 'cfbd_rankings') {
      data = pollTop(data, typeof args?.poll === 'string' ? args.poll : undefined, args?.top_n);
    }
    return json(data);
  } catch (err) {
    return fail(err);
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
