# jokeapi-mcp

Safe-mode jokes by category, search and id - no API key.

## Tools

- `get_joke` — One safe-mode joke, or several at once, optionally from a category like Programming or Pun.
- `search_jokes` — Find jokes that contain a word or phrase, e.g. 'chicken' or 'programmer'.
- `joke_by_id` — Fetch one specific joke by its numeric id, so you can reuse the same joke.
- `list_categories` — All safe-mode joke categories.
- `joke_info` — How many jokes exist and how they break down by category.
- `list_languages` — Languages the joke database is translated into.
- `random_programming_joke` — A quick programming joke - handy when you just want something to say to a developer.
- `jokes_by_type` — Only one-liners or only setup-and-punchline jokes, from any safe-mode category.
- `joke_range` — Fetch a batch of jokes by id range, for building lists or checking ids.

## Setup

No setup. Jokes come from the public JokeAPI with safe mode always on.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `joke_length_profile`
* `joke_type_coverage`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-jokeapi-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
