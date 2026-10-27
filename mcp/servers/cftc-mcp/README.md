# CFTC Commitments of Traders

Commitments of Traders reports: positioning by commercials, funds and small traders for futures markets - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cftc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cftc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/cftc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `latest_cot_report` | Latest Commitments of Traders report for a market. |
| `cot_history` | Recent weekly COT rows for a market. |
| `search_markets` | Find futures markets whose name matches a keyword. |

## Data source

CFTC Public Reporting Environment (Socrata)
