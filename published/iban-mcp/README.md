# IBAN Checker

Validate IBANs offline with the official country length table and mod-97 checksum, and browse every country's format, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/iban-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "iban-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/iban-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `validate_iban` | Validate an IBAN: structure, country length table and mod-97 checksum, with a plain reason when it fails. |
| `list_iban_countries` | List every IBAN country code with its required length, optionally filtered by code or name. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
