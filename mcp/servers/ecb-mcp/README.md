# ECB Data

European Central Bank reference rates, rate history and the ECB policy rate - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ecb-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ecb-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ecb-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `exchange_rate` | Latest ECB reference rate for one currency against the euro. |
| `exchange_rate_history` | Recent daily reference rates for a currency. |
| `ecb_policy_rate` | Latest ECB main refinancing operations rate. |

## Data source

ECB Data Portal API (SDMX)
