# pubg-mcp

Official PUBG API: player lookup, match data, seasons, lifetime and seasonal stats.

## Setup

```bash
export PUBG_API_KEY=YOUR_KEY
```

## Tools

- `get_player` — Look up a PUBG player by name: account id plus recent match ids.
- `get_match` — Full PUBG match data: rosters, participants, damage, telemetry asset url.
- `get_seasons` — All PUBG seasons on a shard with ids for stats queries.
- `get_lifetime_stats` — Lifetime PUBG stats for an account across all game modes.
- `get_season_stats` — One season of PUBG stats for an account: kills, wins, damage per mode.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
