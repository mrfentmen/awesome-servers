# Finance Calculator

Loan payments, amortisation schedules, compound interest and net present value - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/finance-calc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "finance-calc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/finance-calc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `loan_payment` | Monthly payment, total cost and interest for a fixed-rate loan, with the first 12 amortisation rows. |
| `compound_interest` | Future value of a lump sum with compounding, plus total interest. |
| `net_present_value` | NPV of a cash-flow series and its internal rate of return. |

## Data source

Pure local computation, no network calls.
