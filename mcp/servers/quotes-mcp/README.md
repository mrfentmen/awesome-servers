# quotes-mcp

Unified quotes server: FavQs, ZenQuotes, Stoic quotes, and Quotes REST.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `qotd` — Quote of the day from FavQs.
- `search` — Search FavQs quotes.
- `zenRandom` — Random quote from ZenQuotes.
- `today` — Quote of the day from ZenQuotes.
- `zenQuotes` — List quotes from ZenQuotes.
- `stoicRandom` — Random Stoic quote.
- `stoicMany` — Several Stoic quotes.
- `dummyRandom` — Random quote from DummyJSON.

## Run

```bash
npm install
npm run build
node dist/index.js
```

## Source

Public free APIs only. See `src/api.ts` for exact endpoints.


