# RDAP MCP

Domain registration data from RDAP, the modern replacement for WHOIS. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/rdap-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "rdap-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/rdap-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `lookup_domain` | Registration data for a domain |

## Notes

RDAP is the official successor to WHOIS. Some registries redact contact details for privacy.

## Licence

MIT
