# Smithsonian Volcanoes

Smithsonian Global Volcanism Program: search Holocene volcanoes, read summaries, eruption years and rock types - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/volcano-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "volcano-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/volcano-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_volcanoes` | Search Holocene volcanoes by name, country or region. |
| `volcano_detail` | One volcano: last eruption, elevation, setting, rock type and the GVP summary. |

## Data source

Smithsonian Institution Global Volcanism Program (WFS layer, filtered locally)
