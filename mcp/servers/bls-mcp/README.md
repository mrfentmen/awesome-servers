# US Bureau of Labor Statistics

BLS economic series: employment, CPI, wages and more by series id, with the survey list and popular series - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/bls-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "bls-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/bls-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `series_data` | Observations for one BLS series id over a year range. |
| `list_surveys` | Every BLS survey with its abbreviation and name. |
| `popular_series` | The series BLS highlights as most requested, with their ids. |

## Data source

BLS Public Data API v2 (no registration key - limited to 25 queries a day per IP)
