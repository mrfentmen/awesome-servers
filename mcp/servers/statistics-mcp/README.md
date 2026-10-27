# Statistics

Descriptive statistics, correlation and linear regression for numeric samples - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/statistics-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "statistics-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/statistics-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `describe_sample` | Mean, median, quartiles, spread and outliers for a sample. |
| `correlate` | Pearson and Spearman correlation between two equal-length series. |
| `linear_regression` | Fit y = a + bx and report slope, intercept, R squared and standard error. |

## Data source

Pure local computation, no network calls.
