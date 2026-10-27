# Locale Format

Format numbers, currencies, dates and relative times for any locale using ICU data - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/locale-format-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "locale-format-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/locale-format-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `format_number` | Format a number with locale grouping, currency or percent style. |
| `format_date` | Format an ISO date or timestamp for a locale and style. |
| `format_relative` | Describe a timestamp relative to now, such as 3 days ago. |

## Data source

Node Intl (ICU) data, no network calls.
