# hts-tariff-mcp

US Harmonized Tariff Schedule from the USITC: look up a tariff code, search descriptions, walk a heading or pull a whole chapter with duty rates.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hts-tariff-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hts-tariff-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hts-tariff-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_tariff` | Search tariff descriptions by keyword |
| `tariff_line` | One tariff line with every duty rate |
| `tariff_range` | Every tariff line in a numeric range |
| `tariff_chapter` | All lines in a two digit HTS chapter |
| `tariff_subtree` | Tariff heading and everything beneath it |

## Data source

USITC HTS
