# Game of Life

Run Conway's Game of Life, detect cycles and measure populations on ASCII grids - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/game-of-life-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "game-of-life-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/game-of-life-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `evolve_life` | Evolve a Life grid for N generations and return the final board. |
| `life_stats` | Population, density and bounding box of a Life pattern. |
| `detect_life_cycle` | Find the period or extinction point of a pattern. |

## Data source

Pure local computation, no network calls.
