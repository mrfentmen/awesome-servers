# Punycode Domains

Convert internationalised domain names between Unicode and punycode (IDNA) and inspect labels - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/punycode-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "punycode-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/punycode-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `domain_to_ascii` | Convert a Unicode domain to its punycode (ASCII) form. |
| `domain_to_unicode` | Convert a punycode domain back to Unicode. |
| `inspect_domain` | Show every label, its ASCII form and whether it needs punycode. |

## Data source

Node WHATWG URL (IDNA) implementation, no network calls.
