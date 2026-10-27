# fingrid-mcp

Fingrid Finnish grid open data: datasets and records. Needs free key.

## Setup

```bash
export FINGRID_API_KEY=...
```

Key goes in the x-api-key header. Free from data.fingrid.fi (10k req/day).

## Tools

- `list_datasets` — Fingrid open datasets with ids for record queries.
- `get_records` — Records from a Fingrid dataset in a time window.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
