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

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
