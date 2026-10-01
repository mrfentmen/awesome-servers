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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `release_feed`
* `incident_history`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
