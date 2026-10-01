# cartesia-mcp

Query the Cartesia API (free tier key; set CARTESIA_API_KEY, Bearer): voice list, localized voices, and speech synthesis (paid usage — synthesizing spends credits).

## Tools

- `list_voices` — Voices available on the account, with language.
- `get_voice` — One voice by id, with its embedding and settings.
- `synthesize_speech` — Render text to MP3 with a voice — this spends credits.

## Source

[cartesia-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/cartesia-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `search_voices`
* `language_roll_call`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-cartesia-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
