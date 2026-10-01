# Uptime MCP

Check website availability, latency, and TLS certificate expiry from the local machine. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `check`  HTTP status and latency.
* `cert`  TLS certificate expiry.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Monitoring products charge for this. Here the checks run locally and the results are bounded.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `dns_records`
* `service_status`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-uptime-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
