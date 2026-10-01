# goatcounter-mcp

GoatCounter stats: totals, hits, browser/system/location breakdowns. Needs site URL + key.

## Setup

```bash
export GOATCOUNTER_BASE_URL=...
```

Needs GOATCOUNTER_BASE_URL (e.g. https://stats.goatcounter.com) plus GOATCOUNTER_API_KEY.

## Tools

- `get_totals` — GoatCounter total pageviews for a date range.
- `get_hits` — GoatCounter per-path pageviews with pagination.
- `get_breakdown` — GoatCounter browser/system/location/language stats.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).
