# publicwww-mcp

Search PublicWWW (paid API key; set PUBLICWWW_API_KEY): sites containing a snippet, URL export.

## Tools

- `search_snippets` — URLs of sites containing a code snippet.

## Source

[publicwww-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/publicwww-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `code_snippet_search`
* `snippet_profile`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-publicwww-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
