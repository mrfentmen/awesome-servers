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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_daily_puzzle`: Get today
- `get_puzzle`: Get a specific Lichess puzzle by id.
- `get_player`: Get a Lichess player
- `get_top_players`: Top players by performance (blitz, bullet, classical, puzzle, etc.).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_daily_puzzle`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `live_tournaments`
* `team_info`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
