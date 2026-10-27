# lichess mcp

MCP server for **Lichess**, free chess, puzzles, and the best public chess API.

## Tools

| Tool | What it does |
|---|---|
| `get_daily_puzzle` | Today's puzzle (FEN + solution) |
| `get_puzzle` | Puzzle by id |
| `get_player` | Player stats, best rating, games played, account age |
| `get_top_players` | Top players by performance (blitz, bullet, rapid, puzzle…) |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
get_daily_puzzle {}
get_player { username: "DrNykterstein" }   # Magnus, blitz 3153, 10,450 games
get_top_players { perf: "blitz", limit: 10 }
```

Keyless. Throttled to ~1 req/s to stay polite to the server. Closed/disabled accounts (e.g. hikaru) degrade gracefully.
