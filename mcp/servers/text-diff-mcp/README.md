# Text Diff

Unified diffs of two texts: change hunks with context, plus added and removed line counts - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/text-diff-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "text-diff-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/text-diff-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `unified_diff` | Build a unified diff (patch format) between two texts. |
| `diff_stats` | Count added, removed and unchanged lines between two texts. |

## Data source

Longest common subsequence diff, computed locally
