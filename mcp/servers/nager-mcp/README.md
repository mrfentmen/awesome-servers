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

These tools need a licence key:

* `working_day_calendar`
* `holiday_observance_audit`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
