# US Naval Observatory

Sun rise and set, moon phases, twilight times and the seasons from the US Naval Observatory - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/usno-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "usno-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/usno-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `sun_moon_day` | Sun and moon events for one day at a latitude and longitude. |
| `moon_phases` | Every new, first quarter, full and last quarter moon in a year. |
| `seasons` | Equinoxes, solstices, perihelion and aphelion for a year. |

## Data source

US Naval Observatory Astronomical Applications API
