# Lichess

Lichess accounts and puzzles: player ratings, recent activity, online status and the puzzle of the day - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/lichess-stats-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "lichess-stats-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/lichess-stats-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `user_profile` | A Lichess account: ratings per time control, games played and profile. |
| `user_activity` | Recent activity streaks: games, puzzles and practice days. |
| `user_status` | Whether accounts are online, playing or otherwise busy. |
| `daily_puzzle` | The puzzle of the day with its solution moves and themes. |

## Data source

Lichess public API
