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

- `search_plugins`: Search JetBrains Marketplace plugins: names, descriptions, downloads, ratings.
- `get_plugin`: One JetBrains plugin: vendor, downloads, rating, description, page link.
- `top_plugins`: The Marketplace charts: the most-downloaded or highest-rated plugins overall.
- `plugin_versions`: Recent releases of one plugin, with version strings and release dates.
- `plugin_reviews`: Read the most recent written reviews of a plugin, with each reviewer's star rating and date, so you can judge real user sentiment.
- `plugin_ratings`: Show a plugin's review score distribution — how many raters gave each star value and the average — so an agent can tell a strong plugin from a thin one.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.
