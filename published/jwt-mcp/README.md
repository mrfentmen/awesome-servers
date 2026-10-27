# JWT Inspector

Decode JSON Web Tokens locally: header, claims, expiry timeline and warnings - no signature check, no network.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jwt-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jwt-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jwt-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `decode_jwt` | Decode a JWT and show its header, claims and expiry state. |
| `token_timeline` | Timeline of issued-at, not-before and expiry claims, with time left. |

## Data source

JWT decoding (base64url) implemented locally. Signatures are never verified
