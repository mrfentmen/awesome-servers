# URL and Base64 Toolkit

URL and encoding work offline: parse a URL, percent-encode or decode text, and convert base64 both ways - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/uri-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "uri-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/uri-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_url` | Break a URL into parts and list its query parameters decoded. |
| `encode_url` | Percent-encode text, either as a component or as a whole URL. |
| `decode_url` | Percent-decode text and report any malformed escapes. |
| `base64_encode` | Encode text to base64 or base64url. |
| `base64_decode` | Decode base64 or base64url back to text. |

## Data source

WHATWG URL parsing and base64 helpers, running locally
