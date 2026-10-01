# simplecast-mcp

Search podcasts and analyse any RSS feed - no API key.

## Tools

- `search_podcasts` — Search the Apple Podcasts catalogue by name or topic and get each show's episode count, genre, Apple id and RSS feed URL. No API key needed.
- `search_episodes` — Search podcast episode titles across the whole Apple Podcasts catalogue and return the show, date and length of each match.
- `podcast_charts` — Apple Podcasts top chart for a country, with rank, publisher and genre for every show.
- `podcast_details` — Look up one show by Apple id or by name and get its publisher, genre, episode count, latest release and a live check of its RSS feed.
- `latest_episodes` — Read any podcast RSS feed and list its newest episodes with publication date, length and audio URL.
- `podcast_stats` — Analyse a podcast feed: episode count, first and latest episode, average length, publishing cadence and whether the show is overdue.
- `compare_podcasts` — Compare two podcast feeds side by side on episode count, latest episode, average length and publishing cadence.

## Setup

No setup. Uses the public Apple Podcasts search and any podcast RSS feed.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `feed_audit`
* `audio_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
