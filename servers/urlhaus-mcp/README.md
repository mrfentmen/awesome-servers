# urlhaus-mcp

Query URLhaus (abuse.ch, free auth-key from abuse.ch; set URLHAUS_AUTH_KEY, sent as Auth-Key header): recent malicious URLs, URL lookup, payload lookup by SHA256, tag search.

## Tools

- `recent_urls` — Recently added malicious URLs.
- `lookup_url` — Check one URL against URLhaus.
- `lookup_payload` — Malware payload details for one SHA256 hash.
- `search_tag` — Malicious URLs carrying a malware tag, e.g. emotet.

## Source

[urlhaus-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/urlhaus-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `feed_digest`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-urlhaus-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
