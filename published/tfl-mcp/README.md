# Transport for London

TfL live data: line status across tube, DLR and rail, stop search and real-time arrivals - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/tfl-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "tfl-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/tfl-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `line_status` | Current status of TfL lines by mode, with disruption reasons when something is wrong. |
| `search_stops` | Find stations and stops by name; returns the ids needed for arrivals. |
| `station_arrivals` | Real-time arrivals at a stop id, sorted by time to station. |

## Data source

Transport for London Unified API (api.tfl.gov.uk), no key required for low volumes
