# MLB Stats MCP

MLB Stats API: teams, division standings, schedules, rosters, player profiles — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y mlb-stats-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "mlb-stats-mcp": { "command": "npx", "args": ["-y", "mlb-stats-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_teams` | Every team with its id, grouped by division |
| `standings` | Division standings with records and streaks |
| `games_on_date` | Every game on one day, with scores |
| `team_roster` | Active roster with positions and numbers |
| `team_overview` | League, venue and season record |
| `player_profile` | Bio plus headline season stats |
| `team_schedule` | Next five games and last five results |

## Example

```
American League East
   Tampa Bay Rays           98-64 (.605) L1
   New York Yankees         93-68 (.578) W1 GB 4.5
```

## Notes

Standings only carry league and division ids, so this server resolves the names through the divisions endpoint and caches them. Data comes straight from MLB.

## Licence

MIT
