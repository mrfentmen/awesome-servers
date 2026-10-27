# SSL Cert MCP

Inspect TLS certificates of a host including issuer, expiry, and subject alternative names. No key required.

This file is self contained. It reads public data only and never writes to the machine. All output is bounded and honest about what could not be fetched.

## Tools


* `cert_info`  Certificate details for a host.

## Usage

```bash
npm install
npm run build
node dist/index.js
```

Performs a real TLS handshake to the host. The certificate is read from the live connection.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
