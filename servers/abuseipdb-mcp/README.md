# AbuseIPDB MCP

MCP server for AbuseIPDB: IP abuse reports, reputation. Free key.

Pairs well with `virustotal-mcp`, `maltiverse-mcp`, and `whois-mcp`.

## Setup

Get a key at https://www.abuseipdb.com/account/api/ (free, 1000 calls/day), then:

```bash
export ABUSEIPDB_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `check_ip`: Confidence, country, ISP, reports.
- `blacklist`: Worst IPs right now.

- `check_block`
- `recent_reports`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to AbuseIPDB. Read-only.
