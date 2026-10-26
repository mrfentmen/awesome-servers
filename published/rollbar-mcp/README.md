# rollbar-mcp

Query the Rollbar API (free tier token; set ROLLBAR_ACCESS_TOKEN, query param): projects, project items, item details.

## Tools

- `list_projects` — Rollbar projects the token can read.
- `list_items` — Error items in one project, most recent first.
- `get_item` — One error item by id, with occurrences and stack.

## Source

[rollbar-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/rollbar-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
