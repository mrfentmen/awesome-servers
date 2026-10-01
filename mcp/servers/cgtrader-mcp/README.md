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

These tools need a licence key:

* `category_tree`
* `taxonomy_profile`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
