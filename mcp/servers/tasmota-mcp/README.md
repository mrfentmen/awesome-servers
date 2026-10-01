# Tasmota MCP

MCP server for Tasmota devices: status, power control. Local-first smart home.

## Setup

```bash
export TASMOTA_URL=http://tasmota-device-ip
export TASMOTA_USER=user_if_set
export TASMOTA_PASSWORD=secret_if_set
npm install
npm run build
node dist/index.js
```

One server instance talks to one device — run one per device with different URLs.

## Tools at a glance

- `status`: Device info, power, uptime, wifi.
- `set_power`: on/off/toggle per outlet.
- `read_sensor`: Sensor readings if present.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Everything stays on your network.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `cmnd_payload`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-tasmota-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
