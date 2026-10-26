# radarr-mcp

Query your Radarr instance (self-hosted; set RADARR_URL + RADARR_API_KEY, query param): movies, queue, health. Endpoints per official docs.

## Tools

- `list_movies` — Movies in the Radarr library, with status.
- `get_queue` — Active downloads and imports in the queue.
- `get_health` — Radarr health warnings and errors.

## Source

[radarr-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/radarr-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
