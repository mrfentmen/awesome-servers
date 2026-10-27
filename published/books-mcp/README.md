# Google Books MCP

Search books and fetch volume details from the public Google Books API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search_books`  Search books by title or author.
* `book_info`  Details for a specific volume.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The Google Books API can rate limit shared IPs. The server returns an honest error when the quota is temporarily exhausted.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
