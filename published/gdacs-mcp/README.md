# GDACS Disaster Alerts MCP

GDACS: live earthquake, cyclone, flood, volcano, wildfire and drought alerts with severity — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y gdacs-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "gdacs-mcp": { "command": "npx", "args": ["-y", "gdacs-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `current_alerts` | Live alerts across all six hazard types |
| `alerts_by_type` | Every current event of one hazard |
| `alert_summary` | Counts by level and hazard, plus the worst event |
| `event_detail` | Severity numbers and official report link |
| `hazard_types` | Hazard codes and alert levels |

## Example

```
1. Green EQ — Earthquake in Vanuatu [id 1573554, episode 1742315]
   2026-10-24 · Vanuatu · score 1
   Magnitude 5.5M, Depth:194.632km
```

## Notes

Every tool reads GDACS' live MAP endpoint. Their date-range SEARCH endpoint is sometimes 90 seconds slow, so it is deliberately not used.

## Licence

MIT
