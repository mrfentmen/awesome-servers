# GDELT MCP

Search the GDELT global news archive, a free index of billions of articles. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_news`  Search news articles by keyword.
* `news_by_country`  Search news mentioning a place.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

GDELT limits requests to one every 5 seconds. The server paces requests automatically to stay within the limit.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
