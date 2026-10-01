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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `thread_digest`
* `category_roadmap`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
