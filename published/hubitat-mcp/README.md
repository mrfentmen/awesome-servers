# Hubitat MCP

MCP server for Hubitat: devices, status, commands via Maker API. Local-first smart home.

## Setup

In Hubitat, install the built-in **Maker API** app and note the app id + token, then:

```bash
export HUBITAT_URL=http://hubitat.local
export HUBITAT_APP_ID=123
export HUBITAT_TOKEN=your_token
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_devices`: Ids, labels, types.
- `device_status`: Current attribute values.
- `send_command`: on/off/setLevel and friends.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
