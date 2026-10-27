# NPI Registry

CMS NPI Registry: look up US healthcare providers and organisations by NPI, name, state or taxonomy - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/npi-registry-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "npi-registry-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/npi-registry-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `provider_by_npi` | Everything the registry holds for one NPI number. |
| `search_providers` | Search providers by last name, first name, state and taxonomy description. |

## Data source

CMS NPPES NPI Registry API
