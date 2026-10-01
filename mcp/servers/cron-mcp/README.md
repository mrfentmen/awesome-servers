# Cron MCP

Parse, describe, and compute next runs for cron expressions on the local machine. No network, no key.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `describe`  Describe a cron expression.
* `next`  Next run times.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Parsing uses the open source cron-parser library and runs entirely locally.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `previous_runs`
* `validate`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-cron-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
