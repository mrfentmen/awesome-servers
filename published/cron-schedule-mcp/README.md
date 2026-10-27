# Cron Schedules

Cron expression helper: explain a schedule in plain words and list its next run times, with validation - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cron-schedule-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cron-schedule-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/cron-schedule-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `describe_cron` | Explain a cron expression in plain words. |
| `next_runs` | Upcoming run times for a cron expression, in ISO local time. |
| `parse_cron` | Expand each cron field into the exact values it matches. |

## Data source

Cron field rules (Vixie style, five fields) implemented locally
