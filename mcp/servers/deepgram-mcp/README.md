# deepgram-mcp

Query the Deepgram API (free tier key; set DEEPGRAM_API_KEY, sent as Token): projects, project balances, and API keys.

## Tools

- `list_projects` — Deepgram projects with IDs and names.
- `get_balance` — Credit balance for one Deepgram project.
- `list_keys` — API keys on the project, with scopes and created date.

## Source

[deepgram-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/deepgram-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `request_log`
* `usage_breakdown`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-deepgram-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
