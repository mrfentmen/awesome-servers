# VirusTotal MCP

MCP server for VirusTotal: file, URL, domain, IP reports. Free key.

Pairs well with `maltiverse-mcp`, `hudsonrock-mcp`, `osv-mcp`, and `urlscan-mcp`.

## Setup

Get a key at https://www.virustotal.com/gui/my-apikey/ (free, 500 calls/day), then:

```bash
export VIRUSTOTAL_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `file_report`: Engine verdicts for a hash.
- `url_report`: Engine verdicts for a URL.
- `domain_report`: Verdicts and reputation.
- `ip_report`: Verdicts and reputation.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to VirusTotal. Read-only.
