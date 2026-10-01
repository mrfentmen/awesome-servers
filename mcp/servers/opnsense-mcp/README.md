# opnsense-mcp

Query your OPNsense (self-hosted; set OPNSENSE_URL + OPNSENSE_KEY + OPNSENSE_SECRET, key/secret basic auth): firmware status, interface stats. Endpoints per official docs.

## Tools

- `get_firmware_status` — Installed version and whether an update is available.
- `get_interfaces` — Traffic counters per interface.

## Source

[opnsense-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/opnsense-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `known_exploited_check`
* `package_availability`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-opnsense-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
