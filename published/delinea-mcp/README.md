# delinea-mcp

Delinea Secret Server API: OAuth login, secret search, secret retrieval, folders.

## Setup

```bash
export DELINEA_BASE_URL=...
```

Needs DELINEA_BASE_URL (e.g. https://tenant.secretservercloud.com) plus DELINEA_USERNAME and DELINEA_PASSWORD.

## Tools

- `search_secrets` — Search Delinea secrets by text across allowed vaults.
- `get_secret` — Retrieve one Delinea secret with field values.
- `list_folders` — Top-level Delinea secret folders.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
