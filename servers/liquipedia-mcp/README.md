# liquipedia-mcp

Keyless Liquipedia esports wiki: search pages, read articles, recent changes, categories, backlinks.

## Setup

No API key needed.

## Tools

- `search_pages` — Search a Liquipedia game wiki for pages: players, teams, tournaments.
- `get_page` — Read a Liquipedia page as plain text: player bios, team rosters, tournament results.
- `get_recent_changes` — Recent edits on a Liquipedia wiki: roster moves, results updates.
- `get_category_members` — List pages in a Liquipedia category, e.g. tournament or team categories.
- `get_backlinks` — Pages linking to a Liquipedia page: related players, teams, events.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `wiki_search`
* `page_info`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
