# nager-mcp

Worldwide public holidays and long weekends - no API key.

## Tools

- `list_countries` — Every country the public holiday API covers, with its two-letter code.
- `country_info` — Official name, region and land borders for a country.
- `get_holidays` — All public holidays for a country and year, with local and English names.
- `next_holidays` — The next public holidays for a country, starting from today.
- `worldwide_holidays` — The next public holidays around the world - useful for planning around other countries' closures.
- `long_weekends` — Long weekends in a country and year, and whether a bridge day off is needed to get them.
- `is_today_holiday` — Whether today is a public holiday in a country.
- `regional_holidays` — Holidays that actually apply in one subdivision (US-CA, DE-BE, CA-ON): national days plus local ones.
- `holiday_on_date` — Is one specific date a public holiday? Answers yes or no, with the previous and next holiday.
- `compare_countries` — Shared, and country-specific, public holidays for two countries in one year.

## Setup

No setup. Holiday data comes from the public Nager.Date API.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `working_day_calendar`
* `holiday_observance_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-nager-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
