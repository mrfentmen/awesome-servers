# FDIC Bank Data

US bank data from the FDIC: search institutions by name, state or city and read assets, deposits and status - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/fdic-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "fdic-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/fdic-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_institutions` | Find banks by name, optionally narrowed to a state. |
| `institution_detail` | One bank by its FDIC certificate number. |
| `banks_in_state` | Active banks headquartered in a state, largest first. |

## Data source

FDIC BankFind Suite API (api.fdic.gov)
