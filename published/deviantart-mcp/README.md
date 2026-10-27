# deviantart-mcp

DeviantArt browse: hot, newest, tags, deviation metadata. Needs app credentials.

## Setup

```bash
export DEVIANTART_CLIENT_ID=...
```

Needs a DeviantArt app client id + secret (DEVIANTART_CLIENT_SECRET). Uses client-credentials flow.

## Tools

- `browse_hot` — Currently hot DeviantArt deviations with authors and stats.
- `browse_newest` — Newest DeviantArt deviations across the site.
- `search_tags` — DeviantArt deviations tagged with a word.
- `get_deviation` — Metadata for DeviantArt deviations by id.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
