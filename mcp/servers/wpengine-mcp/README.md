# wpengine-mcp

WP Engine hosting API: installs, sites. Needs API credentials.

## Setup

```bash
export WPENGINE_USERNAME=...
```

Needs WPENGINE_USERNAME plus WPENGINE_PASSWORD (API password). Sent as HTTP Basic.

## Tools

- `list_installs` — All WP Engine installs with status, PHP version and domains.
- `get_install` — One WP Engine install with full details.
- `list_sites` — WP Engine sites with install links.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

<!-- paywall -->
## Premium tools

These tools need a license key:

* `current_incidents`
* `upcoming_maintenance`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wpengine-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
