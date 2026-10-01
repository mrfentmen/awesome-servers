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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `hn_search`
* `reddit_search`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
