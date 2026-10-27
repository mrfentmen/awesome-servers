# Raider.IO

World of Warcraft Mythic+ data: weekly affixes and recent high-end dungeon runs - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/raiderio-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "raiderio-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/raiderio-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_affixes` | This week's Mythic+ affixes for a region. |
| `recent_mythic_runs` | Recent top Mythic+ runs for the current season. |

## Data source

Raider.IO public API
