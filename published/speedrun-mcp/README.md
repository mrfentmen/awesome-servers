# speedrun mcp

MCP server for **speedrun.com**, the world record database for speedrunning.

## Tools

| Tool | What it does |
|---|---|
| `search_games` | Find a game + its speedrun.com id (with platform names) |
| `get_world_records` | Current world records for every category, top 3 runs each |
| `get_leaderboard` | Leaderboard for a specific category |
| `get_categories` | List a game's categories (Any%, 100%, glitchless…) |
| `get_runner` | Speedrunner profile |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
search_games { query: "Super Mario 64" }        → id o1y9wo6q, N64/Wii VC/Switch
get_world_records { gameId: "o1y9wo6q" }
get_leaderboard { gameId: "o1y9wo6q", categoryId: "..." }
```

Keyless. Times are parsed from ISO-8601 durations (`PT1H02M03.456S` → `1:02:03.456`). Respects the API's 100 req / 10 min limit and surfaces a friendly rate limit error.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_games`: Search speedrun.com for a game. Returns game ids used by the other tools.
- `get_world_records`: Get the current world records for a game - every category with the
- `get_leaderboard`: Get a leaderboard for a specific game category.
- `get_categories`: List a game
- `get_runner`: Look up a speedrunner profile by user id.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `search_games`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
