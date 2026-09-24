# FMP MCP

MCP server for Financial Modeling Prep: quotes, profiles, financials. Free key.

## Setup

Get a key at https://site.financialmodelingprep.com/ (free), then:

```bash
export FMP_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `stock_quote`: Price, range, market cap.
- `company_profile`: Industry, CEO, description.
- `income_statement`: Revenue and net income in billions.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to FMP. Read-only.
