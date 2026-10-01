# Zitadel MCP

MCP server for Zitadel: users, organizations. Works with any instance.

## Setup

```bash
export ZITADEL_URL=https://my-org.zitadel.cloud
export ZITADEL_TOKEN=service_user_pat
npm install
npm run build
node dist/index.js
```

Create the token as a service user (PAT) with user/org read permissions. The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_users`: Humans with emails and states.
- `list_organizations`: Organizations.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `audit_users`
* `credential_report`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-zitadel-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
