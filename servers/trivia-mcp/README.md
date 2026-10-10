# trivia-mcp

Open Trivia DB questions and categories.

A merged MCP server that consolidates duplicate single-purpose servers in this monorepo into one focused server.

## Tools

- `getQuestion` — Random trivia question.
- `categories` — Available trivia categories.
- `getCategories` — Every trivia category with id.
- `getQuestions` — Trivia questions with answers.

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

* `boolean_question`
* `category_list`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-trivia-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
