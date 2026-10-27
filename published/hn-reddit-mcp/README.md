# HN Reddit MCP

Read top stories from Hacker News and top posts from any subreddit. No API key is required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `get_hn_top`  Top Hacker News stories with scores.
* `get_hn_item`  One story or comment by id.
* `get_reddit_top`  Top posts from a subreddit.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Uses the official Hacker News Firebase API and the public Reddit JSON endpoint.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
