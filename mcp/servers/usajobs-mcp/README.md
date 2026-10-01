# USAJOBS MCP

MCP server for USAJOBS: federal job search. Needs a free API key.

## Setup

Get a key at https://developer.usajobs.gov/ (free), then:

```bash
export USAJOBS_API_KEY=your_key_here
export USAJOBS_EMAIL=you@example.com  # required contact in User-Agent
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_jobs`: US federal jobs by keyword and location, with pay bands and closing dates.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to USAJOBS. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `hiring_rules`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-usajobs-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
