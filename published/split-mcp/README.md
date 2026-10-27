# split-mcp

Split feature flags: workspaces, splits, segments. Needs admin API key.

## Setup

```bash
export SPLIT_API_KEY=...
```

## Tools

- `list_workspaces` — Split workspaces with ids for scoped queries.
- `list_splits` — Feature flags in a Split workspace with treatments and defaults.
- `list_segments` — Targeting segments in a Split workspace.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
