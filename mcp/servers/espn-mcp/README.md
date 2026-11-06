# ESPN MCP

Live scores from ESPN — teams, scores and game status for any sport and league ESPN covers. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/espn-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "espn-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/espn-mcp"] }
  }
}
```

## Tool

| Tool | What it does |
|---|---|
| `scoreboard` | Games for a sport and league, with scores and status |

## Example

```
National Football League — 2026-11-05
15 games

- Baltimore Ravens 24 at Pittsburgh Steelers 17 — Final
- Kansas City Chiefs 21 at Denver Broncos 14 — Final
```

## Leagues

`football/nfl`, `basketball/nba`, `baseball/mlb`, `hockey/nhl`,
`soccer/eng.1`, `soccer/esp.1`, `basketball/wnba`, `football/college-football`.

Any league ESPN publishes works — the slug is passed straight through. A wrong
pairing returns ESPN's 404 as a plain message.

## Notes

Reads ESPN's public scoreboard endpoint. No key, no login.

`dates` is `YYYYMMDD`; leave it out for today. ESPN decides what "today" means,
so a date in your timezone can land on the neighbouring day.

Only the first competition of each event is read. That is the game itself for
every league tested.

## Licence

MIT
