# Treasury Fiscal Data

US Treasury fiscal data: national debt, average interest rates and the Monthly Treasury Statement - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/fiscaldata-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "fiscaldata-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/fiscaldata-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `national_debt` | Latest total public debt outstanding, split by public and intragov holdings. |
| `average_interest_rates` | Latest average interest rates on Treasury securities. |
| `monthly_treasury_statement` | Latest Monthly Treasury Statement receipt and outlay rows. |

## Data source

US Treasury Fiscal Data API
