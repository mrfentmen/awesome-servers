# Kiwi MCP

MCP server for Kiwi.com flights: search, airlines. Needs a free API key.

## Setup

Get a key at https://tequila.kiwi.com/portal/ (free), then:

```bash
export KIWI_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `find_locations`: Airport codes by city name for flight search.
- `search_flights`: Cheapest flights between airports in a date range, with airlines and links.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Kiwi's API. Read-only.

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
