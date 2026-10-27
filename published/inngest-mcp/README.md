# Inngest MCP

MCP server for Inngest: send events, list apps. Needs an event key.

## Setup

Keys live at dashboard > Manage (Event Keys, Signing Key), then:

```bash
export INNGEST_EVENT_KEY=your_event_key
export INNGEST_SIGNING_KEY=your_signing_key  # only for list_apps
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `send_event`: Trigger functions with a named event + payload.
- `list_apps`: Registered apps.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local and go only to Inngest.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
