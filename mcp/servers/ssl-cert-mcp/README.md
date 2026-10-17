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


