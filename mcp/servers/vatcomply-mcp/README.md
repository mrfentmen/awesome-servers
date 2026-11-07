# VAT Comply MCP

Foreign exchange rates and EU VAT rates from VAT Comply. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/vatcomply-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "vatcomply-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/vatcomply-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `exchange_rates` | Latest rates for a base currency |
| `vat_rates` | EU VAT rates by country |

## Notes

Rates are daily reference rates. The base currency is a three letter code such as USD or EUR.

## Licence

MIT
