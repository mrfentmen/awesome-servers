# Frankfurter MCP

Frankfurter: ECB exchange rates, conversion, per-date rates, history and multi-currency comparison — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/frankfurter-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "frankfurter-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/frankfurter-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_currencies` | Every currency with a published rate |
| `latest_rates` | Latest ECB rates for a base currency |
| `convert_currency` | Convert an amount at the latest rate |
| `exchange_history` | First, last, change and range over N days |
| `rates_on_date` | Rates for one exact date |
| `compare_currencies` | Percent moves of several currencies vs USD |

## Example

```
100 USD = 89.38 EUR
Rate: 1 USD = 0.893810 EUR · ECB reference for 2026-10-26
```

## Notes

Data is the European Central Bank reference rates, not live interbank quotes. Weekends and holidays fall back to the previous business day.

## Licence

MIT
