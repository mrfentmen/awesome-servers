# brave-mcp

Search with Brave Search API (free key; set BRAVE_API_KEY, X-Subscription-Token): web results, news results.

## Tools

- `web_search` — Web results with titles, URLs and snippets.
- `news_search` — Recent news articles matching a query.

- `image_search` — Image results.
- `video_search` — Video results.
- `suggest_queries` — Query suggestions.
- `spellcheck` — Spelling fixes.
- `list_goggles` — Custom search goggles.
- `faq_search` — FAQ-style answers.
- `discussion_search` — Forum threads.
- `localized_search` — Country-scoped results.

## Source

[brave-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/brave-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `freshness_sweep`
* `goggle_search`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-brave-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
