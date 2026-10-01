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

<!-- paywall -->
## Premium tools

These tools need a license key:

* `tls_details`
* `cert_expiry`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ssl-cert-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
