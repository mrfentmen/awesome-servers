# Base58

Encode and decode base58 and base58check offline, with version bytes and checksum verification, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/base58-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "base58-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/base58-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `base58_encode` | Encode bytes as base58 or base58check, optionally with a version byte. |
| `base58_decode` | Decode base58 text to hex, base64 and text, verifying the checksum when asked. |
| `base58_alphabet_info` | The base58 alphabet and the common version bytes used with base58check. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
