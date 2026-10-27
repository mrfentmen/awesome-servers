# collegefootballdata-mcp

MCP server for the [CollegeFootballData.com](https://collegefootballdata.com)
(CFBD) API — the community college football statistics and ratings API.

Checked 2026-10-23: CFBD has no first-party MCP server and npm has no MCP
package for it. See `mcp/MISSING.md` for the log. Auth is one free Bearer
key (sign in at the API site); this server sends it as the documented
`authorization` query parameter.

## Tools (20)

| Tool | CFBD endpoint | What it answers |
|---|---|---|
| `cfbd_conferences` | `/conferences` | every conference, full name + abbreviation |
| `cfbd_venues` | `/venues` | stadiums: capacity, city/state, elevation, surface |
| `cfbd_teams` | `/teams` | teams with colors, logos, mascot, conference |
| `cfbd_games` | `/games` | a season/week's games with scores (compact rows) |
| `cfbd_scoreboard` | `/scoreboard` | the current/weekly slate, good for live games |
| `cfbd_game_team_stats` | `/games/teams` | team box scores per game |
| `cfbd_betting_lines` | `/games/lines` | spreads, totals, moneylines from several books |
| `cfbd_game_weather` | `/games/weather` | forecasted weather per game |
| `cfbd_rankings` | `/rankings` | AP / Coaches / CFP polls, with optional poll filter + top_n |
| `cfbd_player_game_stats` | `/games/players` | per-player game statistics |
| `cfbd_team_season_stats` | `/stats/season/total` | team season totals by stat category |
| `cfbd_advanced_game_stats` | `/stats/game/advanced` | advanced efficiency stats per game |
| `cfbd_player_search` | `/players` | find a player by name fragment |
| `cfbd_player_season_stats` | `/players/stats` | player season stats by category |
| `cfbd_recruiting_players` | `/recruiting/players` | recruits: stars, rating, ranking, school |
| `cfbd_recruiting_teams` | `/recruiting/teams` | team recruiting rankings per year |
| `cfbd_coaches` | `/coaches` | coaches and their full career stints |
| `cfbd_sp_plus_ratings` | `/metrics/sp+` | SP+ team ratings (offense/defense/ST) |
| `cfbd_srs_ratings` | `/metrics/srs` | SRS team ratings |
| `cfbd_season_calendar` | `/calendar` | which weeks are regular vs postseason |

Read-only everywhere: this server issues GETs only — no betting, no writes,
no third-party accounts.

## Auth

```sh
export COLLEGEFOOTBALLDATA_API_KEY=...
```

## Run

```sh
cd mcp/servers/collegefootballdata-mcp
npm install
npm run build
node dist/index.js        # stdio MCP server
npm test                  # unit tests (pure helpers)
python3 tools/smoke.py    # live check; SKIPs honestly without a key
```

## Wire into OpenCode (`~/.config/opencode/opencode.jsonc`)

```jsonc
"collegefootballdata": {
  "type": "local",
  "command": ["node", "/path/to/awesome-servers/mcp/servers/collegefootballdata-mcp/dist/index.js"],
  "enabled": true,
  "environment": { "COLLEGEFOOTBALLDATA_API_KEY": "..." },
  "timeout": 60000
}
```

## Honesty notes

- Endpoint paths and parameter names follow the public CFBD docs as read on
  2026-10-23; verify against the sandbox on first live use and record what
  actually answers here.
- `/games` rows are compacted client-side (score, teams, venue, excitement);
  call `/games/teams` when you need box scores, not just results.
- Poll filtering (`cfbd_rankings`) is client-side over the returned week;
  `top_n` slices the rows after the vendor answers.
