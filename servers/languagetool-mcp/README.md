# LanguageTool MCP

Keyless MCP server for LanguageTool: grammar, spelling and style checking in 30+ languages.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `check_text`: Issues with fix suggestions (max 20000 chars, public-API fair use).
- `list_languages`: Supported language codes.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Note: checked text is sent to LanguageTool's public API — don't submit secrets.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `translate_text`
* `word_lookup`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-languagetool-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
