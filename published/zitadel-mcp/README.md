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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
