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

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `quote_by_id`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
