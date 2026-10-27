# literal-mcp

Literal reading tracker via GraphQL: library, states, book lookup. Email login.

## Setup

```bash
export LITERAL_EMAIL=...
```

Needs LITERAL_EMAIL plus LITERAL_PASSWORD. Logs in for a 6-month JWT automatically.

## Tools

- `get_books` — Books in your Literal library with authors and covers, newest first.
- `get_books_by_state` — Your Literal books filtered by reading state.
- `get_book` — Literal book detail by slug with authors and description.

Part of [awesome-mcps](https://github.com/mrfentmen/awesome-mcps).

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
