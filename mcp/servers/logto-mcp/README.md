# Logto MCP

MCP server for Logto: users, applications. Works with Cloud or self-hosted.

## Setup

Create a machine-to-machine app with Management API access, then:

```bash
export LOGTO_URL=https://your-tenant.logto.app
export LOGTO_M2M_ID=your_app_id
export LOGTO_M2M_SECRET=your_app_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_users`: Users with emails and join dates.
- `list_applications`: OIDC clients with types.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your tenant.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `signing_keys`
* `token_inspect`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-logto-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
