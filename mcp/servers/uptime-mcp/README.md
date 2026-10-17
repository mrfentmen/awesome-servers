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


