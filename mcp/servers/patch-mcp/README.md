# Unified Patch

Create, check and apply unified diffs offline - a real patch tool with no shell and no repo, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/patch-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "patch-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/patch-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `make_patch` | Produce a unified diff between two texts with configurable context lines. |
| `apply_patch` | Apply a unified diff to text; fails with a precise message when a hunk does not match. |
| `check_patch` | Dry-run a unified diff against text and report whether it applies cleanly. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
