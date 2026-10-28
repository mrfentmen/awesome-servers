# usace-water-mcp

US Army Corps of Engineers water data: reservoir and river levels, project lists and time series from the CWMS Data API.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/usace-water-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "usace-water-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/usace-water-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `offices` | USACE water management offices |
| `projects` | Reservoirs and other projects for one office |
| `project` | One reservoir or project by name |
| `levels` | Gauge levels recorded for an office |
| `time_series` | Read one CWMS time series between two dates |

## Data source

USACE CWMS
