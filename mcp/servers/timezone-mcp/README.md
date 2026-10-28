# Time Zones

IANA time zone maths offline - the time right now in any zone, wall-clock conversion between zones, and the zone list, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/timezone-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "timezone-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/timezone-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `time_in_zone` | Current local time in one IANA zone, with weekday, abbreviation and UTC offset. |
| `convert_time` | Show one moment in two zones; a bare wall-clock time is read in the from zone, handling daylight saving. |
| `list_timezones` | Search the IANA zone list this runtime knows. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
