# ISBN

Validate and convert ISBN-10 and ISBN-13 numbers, with checksum maths - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/isbn-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "isbn-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/isbn-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `validate_isbn` | Validate an ISBN-10 or ISBN-13 checksum and normalise it. |
| `convert_isbn` | Convert between ISBN-10 and ISBN-13 where the book has both. |
| `check_isbn_batch` | Validate a list of ISBNs at once and report the bad ones. |

## Data source

Pure local computation, no network calls.
