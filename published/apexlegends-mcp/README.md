# apexlegends-mcp

Apex Legends status API: player stats, map rotation, crafting rotation, predator counts, servers.

## Setup

```bash
export MOZAMBIQUEHE_API_KEY=YOUR_KEY
```

## Tools

- `get_player` — Apex Legends player stats by name: level, rank, kills, favorite legend.
- `get_player_by_uid` — Apex Legends player stats by platform uid instead of name.
- `get_map_rotation` — Current and next Apex Legends map rotation for battle royale, ranked and mixtape.
- `get_crafting_rotation` — Current Apex Legends replicator crafting rotation: daily and weekly items.
- `get_predator_counts` — Apex Predator badge counts per platform plus minimum RP thresholds.
- `get_server_status` — Apex Legends server status per region: online, slow or down with response times.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
