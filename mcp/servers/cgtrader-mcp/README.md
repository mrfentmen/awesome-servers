# cgtrader-mcp

Query the CGTrader 3D marketplace REST API v1: page through models, fetch model details and file lists, and read your profile. OAuth2 bearer token (`CGTRADER_ACCESS_TOKEN`) from your CGTrader OAuth application required.

## Tools

- `list_models` — Page through CGTrader 3D models.
- `get_model` — One CGTrader model by id, with price and formats.
- `list_model_files` — Files attached to a CGTrader model.
- `get_me` — User profile for the access token.

## Source

[cgtrader-mcp](https://github.com/mrfentmen/awesome-mcps/tree/main/servers/cgtrader-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `category_tree`
* `taxonomy_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-cgtrader-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
