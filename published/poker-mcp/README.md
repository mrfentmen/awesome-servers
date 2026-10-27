# Poker Hands

Evaluate poker hands, compare players and pick the best five from seven cards - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/poker-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "poker-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/poker-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `evaluate_hand` | Rank a five-card poker hand and show its tiebreak cards. |
| `compare_hands` | Compare two five-card hands and say which wins. |
| `best_hand_of_seven` | Choose the best five-card hand from seven cards. |

## Data source

Pure local computation, no network calls.
