# JetBrains MCP

Keyless MCP server for JetBrains Marketplace: plugin search, details, ratings, downloads.

Pairs well with `open-vsx-mcp`, `npm-search-mcp`, and `pypi-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_plugins`: Search JetBrains Marketplace plugins: names, descriptions, downloads, ratings. Sort by relevance, downloads, rating, name or recently updated.
- `get_plugin`: One JetBrains plugin: vendor, downloads, rating, description, page link.
- `top_plugins`: The Marketplace charts: the most-downloaded or highest-rated plugins overall.
- `plugin_versions`: Recent releases of one plugin, with version strings and release dates.
- `plugin_reviews`: Read the most recent written reviews of a plugin, with each reviewer's star rating and date, so you can judge real user sentiment.
- `plugin_ratings`: Show a plugin's review score distribution — how many raters gave each star value and the average — so an agent can tell a strong plugin from a thin one.
- `search_by_build`: Find plugins that actually install on a specific IDE build, e.g. IC-241.18034.62.
- `list_tags`: Every Marketplace tag with its id and product families, filterable by family.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `product_release`
* `plugin_compatibility`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
