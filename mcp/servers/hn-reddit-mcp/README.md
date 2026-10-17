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


