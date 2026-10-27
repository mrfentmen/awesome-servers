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
