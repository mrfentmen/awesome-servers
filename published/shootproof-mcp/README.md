# shootproof-mcp

Query the ShootProof Studio API: service description, authenticated user, brands, brand galleries (events) and orders. OAuth2 bearer token (`SHOOTPROOF_ACCESS_TOKEN`) required — client ID via support@shootproof.com.

## Tools

- `get_service_description` — ShootProof API entry point with navigation links.
- `get_me` — Authenticated ShootProof user profile.
- `list_brands` — Photography brands on the ShootProof account.
- `list_brand_events` — Galleries (events) of a brand.
- `list_brand_orders` — Orders of one ShootProof brand, newest first.

## Source

[shootproof-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/shootproof-mcp)

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
