# Nonogram

Solve, check and render nonogram (picross) puzzles from row and column clues - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nonogram-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nonogram-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nonogram-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `solve_nonogram` | Solve a nonogram from row and column clues and draw the picture. |
| `check_nonogram` | Check a filled grid against its clues. |
| `clues_from_grid` | Derive row and column clues from a picture. |

## Data source

Pure local computation, no network calls.
