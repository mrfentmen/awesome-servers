# OpenSecrets MCP

MCP server for OpenSecrets: money in U.S. politics. Needs a free API key.

Pairs well with `fec-mcp`, `congress-gov-mcp`, and `govtrack-mcp`.

## Quick start

Get a key at https://www.opensecrets.org/api/ (free), then:

```bash
export OPENSECRETS_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_candidates`: Candidates by name with party/state/chamber.
- `candidate_summary`: Raised, spent, cash, debt per cycle.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to OpenSecrets. Read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `fec_candidate_search`
* `fec_committee_search`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-opensecrets-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
