# opnsense-mcp

Query your OPNsense (self-hosted; set OPNSENSE_URL + OPNSENSE_KEY + OPNSENSE_SECRET, key/secret basic auth): firmware status, interface stats. Endpoints per official docs.

## Tools

- `get_firmware_status` — Installed version and whether an update is available.
- `get_interfaces` — Traffic counters per interface.

## Source

[opnsense-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/opnsense-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
