# frankfurter-mcp

ECB reference exchange rates (Frankfurter).

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `latest` — Latest ECB reference rates.
- `convert` — Convert an amount.
- `history` — Rate history for a period.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


