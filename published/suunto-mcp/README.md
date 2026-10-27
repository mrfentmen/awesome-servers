# suunto-mcp

Suunto API: workout history with heart rate, distance, GPS summaries. Needs OAuth token.

## Setup

```bash
export SUUNTO_ACCESS_TOKEN=...
```

Needs a Suunto app JWT access token plus subscription key from apizone.suunto.com (OAuth2).

## Tools

- `list_workouts` — Recent Suunto workouts: sport, duration, distance, heart rate, start time.
- `get_workout` — One Suunto workout summary: samples metadata, laps, zones, totals.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
