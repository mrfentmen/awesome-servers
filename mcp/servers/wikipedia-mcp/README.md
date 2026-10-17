# Wikipedia MCP

Search Wikipedia, read article summaries, and fetch random articles through the public Wikimedia REST API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Search Wikipedia for articles.
* `summary`  Lead summary for an article.
* `random`  A random article summary.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Summaries come from the Wikimedia REST API and reflect the live article state.


