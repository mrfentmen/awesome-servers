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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
