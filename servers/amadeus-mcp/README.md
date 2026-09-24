# Amadeus MCP

MCP server for Amadeus travel: flights, hotels, airports. Free test key.

## Setup

Get keys at https://developers.amadeus.com/ (free test environment), then:

```bash
export AMADEUS_API_KEY=your_key
export AMADEUS_API_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client. Uses the test environment; switch BASE to production for live booking data.

## Tools at a glance

- `search_airports`: Codes by city.
- `search_flights`: Offers with prices and legs.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Amadeus. Read-only.
