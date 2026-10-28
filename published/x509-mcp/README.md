# X.509 Certificates

Decode PEM certificates, check expiry dates and inspect a live TLS certificate - offline parsing plus an optional TLS fetch, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/x509-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "x509-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/x509-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `decode_pem` | Decode one or more PEM certificates: subject, issuer, serial, validity window, key type, SANs, usage and SHA-256 fingerprint. |
| `check_expiry` | Report days left and expiry state for every certificate in a PEM bundle. |
| `tls_certificate` | Connect to a host over TLS and report the certificate it presents, with chain length and verification result. |

## Data source

Certificate parsing uses Node's built-in crypto/TLS stack. decode_pem and check_expiry are fully offline; tls_certificate makes one TLS connection to the host you name.
