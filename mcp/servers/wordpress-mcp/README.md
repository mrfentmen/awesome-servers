# wordpress-mcp

WordPress plugin and theme search from wordpress.org.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `plugin_info` — Get details for a WordPress plugin.
- `search_plugins` — Search plugins.
- `search` — Search WordPress themes.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `theme_info`
* `theme_list`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wordpress-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
