# worldbank-mcp

World Bank indicators, countries, and EIA energy series.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `indicator` — World Bank indicator for a country.
- `countries` — List World Bank countries.
- `worldbankIndicator` — World Bank development indicator.
- `eiaSeries` — EIA energy series (requires free EIA key).

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `country_profile`
* `indicator_catalog`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-worldbank-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
