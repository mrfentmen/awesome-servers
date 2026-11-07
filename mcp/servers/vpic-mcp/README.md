# NHTSA vPIC MCP

Decode a vehicle identification number with the official NHTSA database. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/vpic-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "vpic-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/vpic-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `decode_vin` | Decode a 17 character VIN |

## Notes

VINs are 17 characters. The decoder returns every field it can match, including make, model, year and fuel type.

## Licence

MIT
