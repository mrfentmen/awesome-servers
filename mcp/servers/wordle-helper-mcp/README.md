# Wordle Helper MCP

Suggest guesses and narrow Wordle candidates on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `suggest`  A strong starting guess.
* `filter`  Filter candidates after feedback.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

The word list is bundled and filtered locally. Marks are g for green, y for yellow, and x for gray.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `pattern_words`
* `rhyming_words`
* `word_facts`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-wordle-helper-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
