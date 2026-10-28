# epa-echo-mcp

EPA ECHO enforcement and compliance: find regulated facilities by state, city, ZIP or name and read their permit, inspection and violation record.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/epa-echo-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "epa-echo-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/epa-echo-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `facilities_in_state` | Regulated facilities in a US state, with compliance status |
| `facilities_by_zip` | Regulated facilities in one US ZIP code |
| `facilities_by_city` | Regulated facilities in one city |
| `facilities_by_name` | Search facilities by name fragment |
| `facility_detail` | Full ECHO record for one facility by registry id |

## Data source

EPA ECHO
