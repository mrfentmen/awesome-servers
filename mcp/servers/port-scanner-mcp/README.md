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

These tools need a licence key:

* `summarize_scan_results`
* `network_origin`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
