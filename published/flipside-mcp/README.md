# flipside-mcp

Flipside Crypto SQL API: run onchain queries, poll status, fetch results, cancel runs.

## Setup

```bash
export FLIPSIDE_API_KEY=YOUR_KEY
```

## Tools

- `create_query` — Submit a Flipside SQL query run against curated blockchain tables. Returns a token; poll status then fetch results.
- `get_query_status` — Poll a Flipside query run: pending, running, finished or failed with row count.
- `get_query_results` — Fetch result rows for a finished Flipside query run, paged.
- `cancel_query` — Cancel a pending or running Flipside query.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
