# SEC EDGAR

SEC EDGAR filings and financial concepts: company profiles by CIK, XBRL tag history and full-text filing search - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/sec-edgar-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "sec-edgar-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/sec-edgar-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `company_profile` | A company by CIK: name, SIC industry, tickers and recent filings. |
| `company_concept` | Historical values of one XBRL tag (a financial concept) for a company. |
| `full_text_search` | Search filing text across EDGAR, newest first. |
| `ticker_lookup` | Convert a stock ticker to the company name and CIK. |

## Data source

SEC EDGAR (data.sec.gov for company and XBRL data, efts.sec.gov for full-text search)
