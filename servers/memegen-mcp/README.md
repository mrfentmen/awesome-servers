# memegen MCP

Keyless MCP server for memegen.link: meme templates, captioned image URL builder.

Pairs well with `meme-generator-mcp` and `robohash-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_templates`: Template ids, names, line counts.
- `make_meme`: Captioned image URL builder (no fetch).
- `get_template`: Blank and example URLs.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `list_caption_fonts`
* `random_quote`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-memegen-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
