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


