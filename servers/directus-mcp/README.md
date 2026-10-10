# directus-mcp

Query your Directus instance (self-hosted or cloud; set DIRECTUS_URL + DIRECTUS_TOKEN, Bearer): collections, users. Endpoints per official docs.

## Tools

- `list_collections` — Collections (tables) in the Directus instance.
- `list_users` — Directus users with email, role and status.

## Source

[directus-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/directus-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `collection_fields`
* `access_review`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-directus-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
