# OTX MCP

MCP server for AlienVault OTX: pulses, indicators. Free key.

Pairs well with `virustotal-mcp`, `abuseipdb-mcp`, and `greynoise-mcp`.

## Setup

Get a key at https://otx.alienvault.com/ (Settings, free), then:

```bash
export OTX_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_pulses`: Threat pulses by keyword.
- `pulse_indicators`: IOCs of one pulse.
- `ip_reputation`: Reputation and pulse memberships.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to OTX. Read-only.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
