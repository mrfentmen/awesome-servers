# vapi-mcp

Query the Vapi API (free tier key; set VAPI_API_KEY, Bearer): assistants, single assistant, call history, call details.

## Tools

- `list_assistants` — Voice assistants on the account, with id and model.
- `get_assistant` — One assistant by id, with its prompt and voice config.
- `list_calls` — Call history with duration, cost and outcome.
- `get_call` — One call by id, with transcript and recording URL.

## Source

[vapi-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/vapi-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `voice_stack_status`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-vapi-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
