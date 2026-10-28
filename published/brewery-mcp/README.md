# Open Brewery DB

Brewery data from Open Brewery DB - name search, filter by city, state or type, and full brewery detail, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/brewery-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "brewery-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/brewery-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_breweries` | Search breweries by name or keyword. |
| `list_breweries` | List breweries filtered by city, state and/or type, page by page. |
| `brewery_detail` | Full record for one brewery by UUID: type, address, coordinates, phone and website. |

## Data source

Open Brewery DB (openbrewerydb.org), a free community dataset of breweries.
