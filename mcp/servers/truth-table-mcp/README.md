# Truth Table

Evaluate boolean logic expressions and build full truth tables - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/truth-table-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "truth-table-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/truth-table-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `evaluate_expression` | Evaluate a boolean expression with named variables. |
| `truth_table` | Build the complete truth table for an expression and list its variables. |
| `check_tautology` | Test whether an expression is a tautology, contradiction or contingent. |

## Data source

Pure local computation, no network calls.
