# openrouter-mcp

Query OpenRouter (free key; set OPENROUTER_API_KEY, Bearer): model list, key info, credits.

## Tools

- `list_models` — Models available on OpenRouter, with context size and price.
- `key_info` — What the current key can spend, and how much is left.
- `credits` — Remaining credit balance for the account.

- `get_model` — Model metadata by ID.
- `search_models` — Models matching text.
- `free_models` — :free tier models.
- `longest_context` — Top context windows.
- `model_endpoints` — Providers/pricing per model.
- `generation_stats` — Cost/usage of a completion.

## Source

[openrouter-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/openrouter-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `model_economics_matrix`
* `deprecation_watch`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-openrouter-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
