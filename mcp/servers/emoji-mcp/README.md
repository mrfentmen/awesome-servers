# Emoji MCP

Search emoji by name or keyword from a bundled catalog. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `search`  Find emoji by keyword.
* `categories`  List categories.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The emoji catalog is bundled with the server and searched locally.


