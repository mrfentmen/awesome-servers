# ip-api MCP

Look up where an IP address is: country, city, ISP and timezone. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ip-api-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ip-api-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ip-api-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `lookup` | Geolocate an IPv4 address |

## Notes

Free tier is IPv4 only, 45 requests per minute, and plain HTTP — that is what the upstream offers without a key.

## Licence

MIT
