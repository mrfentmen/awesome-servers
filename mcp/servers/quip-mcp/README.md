# quip-mcp

Quip Automation API: thread search, thread content, folders. Needs token.

## Setup

```bash
export QUIP_API_TOKEN=...
```

## Tools

- `search_threads` — Search Quip docs, spreadsheets and chats by text.
- `get_thread` — Quip thread with document HTML content.
- `list_folders` — Quip folders including shared folders.
- `get_user` — Authenticated Quip user profile.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `wiki_article`
* `wiki_outline`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-quip-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
