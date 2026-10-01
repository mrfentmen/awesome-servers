# google-fonts-mcp

Query the Google Fonts Developer API (free Google key; set GOOGLE_FONTS_KEY, query param): font list, search, family details.

## Tools

- `list_fonts` — Most popular Google Fonts families, with categories.
- `search_fonts` — Families matching a name, e.g. roboto.
- `get_font` — One family: variants, subsets and font files.

## Source

[google-fonts-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/google-fonts-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `variable_axes`
* `served_font_faces`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-google-fonts-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
