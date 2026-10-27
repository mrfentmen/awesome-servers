# EPA ECHO

EPA ECHO enforcement and compliance: search regulated facilities by state or city, read enforcement totals, and pull a facility site record from Envirofacts - keyless.

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
| `search_facilities` | Find EPA-regulated facilities in a state, optionally filtered to one city. |
| `enforcement_totals` | Enforcement and compliance row counts and total penalties for a state's facilities. |
| `facility_site` | FRS facility site record (address, county, federal agency) by EPA registry ID. |

## Data source

EPA ECHO REST services and the EPA Envirofacts FRS facility registry
