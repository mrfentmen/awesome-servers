# Riddles MCP

Random riddles from the public Riddles API. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `random`  A random riddle.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Data comes from the public Riddles API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `trivia_questions`
* `word_entry`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-riddles-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
