# clerk-mcp

Query the Clerk Backend API (secret key; set CLERK_SECRET_KEY, Bearer): users, user details.

## Tools

- `list_users` — Clerk users, one page at a time, with email and id.
- `get_user` — One Clerk user by id, with profile and metadata.

## Source

[clerk-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/clerk-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `list_sessions`
* `list_memberships`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-clerk-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
