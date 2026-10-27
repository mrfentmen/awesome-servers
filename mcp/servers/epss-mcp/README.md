# EPSS

Exploit Prediction Scoring System scores: how likely a CVE will be exploited in the next 30 days - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/epss-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "epss-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/epss-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_epss_score` | Exploit probability and percentile for one CVE. |
| `top_epss_scores` | Highest-scoring CVEs right now. |
| `epss_above_threshold` | List CVEs whose exploit probability is above a threshold. |

## Data source

FIRST EPSS API
