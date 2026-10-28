# Combinatorics

Exact combinatorics offline with BigInt - factorials, nCr, nPr, Fibonacci, permutations and combinations, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/combinatorics-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "combinatorics-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/combinatorics-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `factorial_of` | Exact factorial using BigInt, with digit count and trailing zeros. |
| `choose_numbers` | Exact nCr (combinations) or nPr (permutations) for large n, computed with BigInt. |
| `fibonacci_of` | Exact Fibonacci number with BigInt and its digit count. |
| `permutations_of` | List every ordering of up to 8 items, with the exact total. |
| `combinations_of` | List every way to choose k items from a list, with the exact total. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
