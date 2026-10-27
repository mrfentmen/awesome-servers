# wpengine-mcp

WP Engine hosting API: installs, sites. Needs API credentials.

## Setup

```bash
export WPENGINE_USERNAME=...
```

Needs WPENGINE_USERNAME plus WPENGINE_PASSWORD (API password). Sent as HTTP Basic.

## Tools

- `list_installs` — All WP Engine installs with status, PHP version and domains.
- `get_install` — One WP Engine install with full details.
- `list_sites` — WP Engine sites with install links.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
