# ISRIC SoilGrids

SoilGrids global soil properties: clay, sand, carbon and pH by depth for any coordinate, plus WRB soil class - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/soilgrids-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "soilgrids-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/soilgrids-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `soil_properties` | Soil property values at a coordinate for chosen properties and depth layers. |
| `classify_soil` | The most likely World Reference Base soil classes at a coordinate with probabilities. |
| `list_soil_codes` | The property codes and depth layers this API accepts. |

## Data source

ISRIC SoilGrids 2.0 REST API (rest.isric.org), no key required
