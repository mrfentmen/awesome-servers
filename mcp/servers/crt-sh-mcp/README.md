# crt.sh MCP

Certificate transparency logs: every TLS certificate issued for a domain. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/crt-sh-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "crt-sh-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/crt-sh-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_certificates` | Certificates issued for a domain |

## Notes

Results come from public certificate transparency logs, so they include old and subdomain certificates. crt.sh is occasionally slow.

## Licence

MIT
