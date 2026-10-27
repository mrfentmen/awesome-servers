# seoul-mcp

Seoul Open Data: real-time air quality across 25 districts, filterable by district.

## Setup

```bash
export SEOUL_API_KEY=...
```

Needs a free Seoul Open Data key from data.seoul.go.kr.

## Tools

- `get_air_quality` — Real-time Seoul air quality for all 25 districts: PM10, PM2.5, ozone, NO2, grades.
- `get_station_air` — Air quality for one Seoul district (gu), e.g. Gangnam-gu, Mapo-gu, Jongno-gu.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
