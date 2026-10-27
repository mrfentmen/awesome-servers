# Matrix Maths

Multiply, invert and find the determinant of matrices with exact rational arithmetic - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/matrix-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "matrix-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/matrix-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `matrix_multiply` | Multiply two matrices and show the result. |
| `matrix_determinant` | Compute a square matrix determinant with fraction-free elimination. |
| `matrix_inverse` | Invert a square matrix using Gauss-Jordan elimination. |

## Data source

Pure local computation, no network calls.
