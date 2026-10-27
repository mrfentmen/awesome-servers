# Public Holidays MCP

Nager.Date public holidays for 110 countries: yearly lists, upcoming days, long weekends, bridge days — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y public-holidays-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "public-holidays-mcp": { "command": "npx", "args": ["-y", "public-holidays-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_countries` | Every covered country |
| `upcoming_holidays` | Next holidays with day counts |
| `holidays_by_year` | Every holiday in one year |
| `is_today_holiday` | Is today a holiday, and which |
| `holiday_on_date` | Check one exact date |
| `long_weekends` | Long weekends with bridge days |
| `country_info` | Region, official name and borders |

## Example

```
Long weekends in US for 2026 (9):

1. 2026-01-01 → 2026-01-04 (4 days) · bridge day: 2026-01-02
```

## Notes

Data comes from Nager.Date. Regional holidays are marked, and countries outside its coverage return a clear error rather than an empty list.

## Licence

MIT
