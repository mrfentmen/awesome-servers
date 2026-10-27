# Rss MCP

RSS in one place: direct feed parsing and rss2json conversion for any feed URL. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `readFeed`  Fetch and parse any RSS or Atom feed.
* `feedJson`  Convert any feed to JSON via rss2json.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
