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

- `search_jobs`: Keyword + location with pay bands and closing dates.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to USAJOBS. Read-only.
