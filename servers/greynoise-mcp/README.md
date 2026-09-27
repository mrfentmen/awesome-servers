# GreyNoise MCP

MCP server for GreyNoise: IP noise classification, tags. Free key.

Pairs well with `virustotal-mcp`, `abuseipdb-mcp`, and `maltiverse-mcp`.

## Setup

Get a key at https://viz.greynoise.io/ (free community tier, 50 calls/week), then:

```bash
export GREYNOISE_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `check_ip`: Noise or threat, with tags.
- `query_tags`: IPs by GNQL query.

- `community_ip`
- `ping`
- `gnql_stats`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to GreyNoise. Read-only.
