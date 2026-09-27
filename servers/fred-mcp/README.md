# FRED MCP

MCP server for FRED economic data: series, observations. Needs a free API key.

Pairs well with `bls-mcp`, `worldbank-mcp`, `treasury-rates-mcp`, and `usfiscaldata`.

## Quick start

Get a key at https://fredaccount.stlouisfed.org/apikeys/ (free), then:

```bash
export FRED_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_series`: Series by keyword with frequencies and units.
- `series_observations`: Latest values, newest first.

- `series_info`
- `series_vintages`
- `release_tables`
- `tag_list`
- `geo_data`
- `releases_list`
- `sources_list`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to FRED. Read-only.
