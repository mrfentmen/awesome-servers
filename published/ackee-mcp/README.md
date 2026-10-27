# ackee-mcp

Self-hosted Ackee analytics via GraphQL: domains, facts, top browsers.

## Setup

```bash
export ACKEE_BASE_URL=...
```

Needs ACKEE_BASE_URL (your instance, e.g. https://stats.example.com) plus ACKEE_API_TOKEN from Ackee settings.

## Tools

- `list_domains` — All Ackee domains with ids and titles.
- `get_domain` — Ackee domain facts: active visitors plus yearly unique views.
- `get_top_browsers` — Top browsers on an Ackee domain over the last 6 months.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Tools

* `list_domains`  All Ackee domains.
* `get_domain`  Domain facts.
* `get_top_browsers`  Top browsers.
* `app_store_search`  Search iOS apps.
* `app_store_reviews`  Read App Store reviews.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
