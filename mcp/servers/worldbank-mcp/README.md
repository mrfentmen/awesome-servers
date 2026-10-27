# @mrfentmen/worldbank-mcp

World Bank Open Data: indicator catalogue search, country series, cross-country comparisons, latest values.

Data source: https://api.worldbank.org/v2 (no key). No API key needed. Runs on stdio.

## Tools

| Tool | What it does |
|---|---|
| `search_indicators` | Find an indicator code across ~29,500 indicators. |
| `indicator_info` | Name, unit and source for one indicator. |
| `country_info` | Region, income level and capital for a country. |
| `indicator_series` | Year-by-year values for one country. |
| `compare_countries` | One indicator for several countries, ranked. |
| `latest_value` | Most recent reported value for a country. |

## Install

```bash
npx -y @mrfentmen/worldbank-mcp
```

Claude Desktop / Cursor config:

```json
{
  "mcpServers": {
    "worldbank-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/worldbank-mcp"] }
  }
}
```

## Example prompts

- compare population of USA and India
- world bank GDP of Japan

## Notes

Responses are plain text, trimmed to the fields that matter. Failures come back as a
readable message (bad name, upstream timeout, not found) instead of a stack trace.

MIT licensed.
