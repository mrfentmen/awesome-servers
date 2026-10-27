# Hacker News MCP

Hacker News in one place: top, jobs, ask, item lookup, and Algolia search. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools

* `top`  Top stories.
* `jobs`  Latest job postings.
* `ask`  Latest Ask HN threads.
* `item`  Look up one item by id.
* `search`  Search stories on Algolia.
* `frontPage`  Current front page.

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
