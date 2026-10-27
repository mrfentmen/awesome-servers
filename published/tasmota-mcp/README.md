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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
