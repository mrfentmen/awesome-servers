# Text Hashing

Hash and HMAC text locally with MD5, SHA-1, SHA-256, SHA-384 and SHA-512, in hex and base64 - no network.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hash-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hash-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hash-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `hash_text` | One digest of a text in the chosen algorithm. |
| `hash_all` | Every supported digest of a text, in hex. |
| `hmac_text` | HMAC of a text with a key, for webhook and API signature checks. |

## Data source

Node's built-in crypto module, running locally
