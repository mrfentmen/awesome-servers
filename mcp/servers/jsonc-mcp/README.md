# JSON with Comments

Work with JSONC offline: strip comments and trailing commas, parse to clean JSON and point at syntax errors - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jsonc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jsonc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jsonc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_jsonc` | Parse JSON with // and /* */ comments (and optional trailing commas) into clean pretty JSON. |
| `strip_jsonc` | Return the same document with comments and trailing commas removed, nothing else changed. |
| `validate_jsonc` | Check a JSONC document and, when it fails, point at the line with a caret. |

## Data source

A small JSONC tokenizer and the platform JSON parser, running locally
