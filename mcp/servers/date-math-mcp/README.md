# Date Maths

Business-day counting, date shifting and calendar differences with holiday support - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/date-math-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "date-math-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/date-math-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `business_days_between` | Count weekdays between two dates, optionally skipping holidays. |
| `add_business_days` | Move a date forward or backward by a number of business days. |
| `date_difference` | Calendar difference between two dates in years, months and days. |

## Data source

Pure local computation, no network calls.
