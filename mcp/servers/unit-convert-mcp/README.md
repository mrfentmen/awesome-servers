# Unit Converter

Convert between 100+ units offline across length, mass, temperature, volume, area, speed, data, energy, pressure, time and angle, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/unit-convert-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "unit-convert-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/unit-convert-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `convert` | Convert a value between two units, with aliases like km, ft, lb and mph. |
| `list_units` | Every supported category, its base unit and the unit names in it. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
