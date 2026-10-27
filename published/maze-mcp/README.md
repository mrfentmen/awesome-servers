# Maze

Generate, solve and render mazes deterministically from a seed - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/maze-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "maze-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/maze-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `generate_maze` | Generate a perfect maze with a seed, ready to print or solve. |
| `solve_maze` | Solve an ASCII maze from its top-left to bottom-right opening. |
| `maze_stats` | Measure a maze: size, open cells, walls and dead ends. |

## Data source

Pure local computation, no network calls.
