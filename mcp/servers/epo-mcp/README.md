# epo-mcp

Search EPO Open Patent Services (free registration; set EPO_CONSUMER_KEY + EPO_CONSUMER_SECRET, OAuth auto-token): published-data search and family.

## Tools

- `search` — Published applications by query.
- `family` — Family for a publication number.

## Source

[epo-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/epo-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `publication_record`
* `legal_status`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-epo-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
