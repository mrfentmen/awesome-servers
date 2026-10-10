# Port Scanner MCP

Scan local or remote hosts for open TCP ports. Runs locally with no external service. Only use on hosts you own or have permission to scan.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `scan_host`  Scan a list of ports.
* `scan_common`  Scan common ports.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Scans are bounded to 50 ports per call and 2 seconds per port. Scanning systems you do not own may be illegal where you live.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `summarize_scan_results`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-port-scanner-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
