# NPS MCP

MCP server for U.S. National Parks: parks, alerts, campgrounds. Free key.

## Setup

Get a key at https://www.nps.gov/subjects/developing-personal-use-api-key.htm/ (free), then:

```bash
export NPS_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_parks`: Parks with states and links.
- `park_alerts`: Closures and alerts.
- `park_campgrounds`: Campgrounds with fees.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to the NPS API. Read-only.


