# shootproof-mcp

Query the ShootProof Studio API: service description, authenticated user, brands, brand galleries (events) and orders. OAuth2 bearer token (`SHOOTPROOF_ACCESS_TOKEN`) required — client ID via support@shootproof.com.

## Tools

- `get_service_description` — ShootProof API entry point with navigation links.
- `get_me` — Authenticated ShootProof user profile.
- `list_brands` — Photography brands on the ShootProof account.
- `list_brand_events` — Galleries (events) of a brand.
- `list_brand_orders` — Orders of one ShootProof brand, newest first.

## Source

[shootproof-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/shootproof-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `daylight_profile`
* `daylight_comparison`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-shootproof-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
