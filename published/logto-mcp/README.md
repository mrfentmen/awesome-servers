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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
