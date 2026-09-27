# usaspending-mcp

USAspending federal agencies and awards, plus nonprofit filings.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `agencies` — Top tier federal agencies.
- `searchAwards` — Search federal awards by keyword.
- `searchFederalAwards` — Search federal contract awards.
- `searchNonprofits` — Search nonprofits and filings.

- `agency_details`
- `category_spending`
- `recipient_search`
- `award_details`
## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.
