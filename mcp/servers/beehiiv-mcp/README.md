# beehiiv MCP

MCP server for beehiiv: publications, posts, subscribers. Needs an API key.

## Setup

Get a key at Publication Settings > API, then:

```bash
export BEEHIIV_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_posts`: beehiiv publication posts with statuses and links.
- `find_subscriber`: Find a beehiiv subscriber by email: status, tier, join date.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to beehiiv's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `publication_stats`
* `list_tiers`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-beehiiv-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
