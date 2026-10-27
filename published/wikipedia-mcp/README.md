# Wikipedia MCP

Search Wikipedia, read article summaries, and fetch random articles through the public Wikimedia REST API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search Wikipedia for articles.
* `summary`  Lead summary for an article.
* `random`  A random article summary.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Summaries come from the Wikimedia REST API and reflect the live article state.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
