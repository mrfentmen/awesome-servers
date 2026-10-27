# Numbers Toolkit

Number work offline: statistics summaries, roman numerals, base conversion and locale-aware formatting - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/numbers-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "numbers-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/numbers-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `statistics` | Summarise a list of numbers: mean, median, mode, spread and quartiles. |
| `to_roman` | Convert a whole number to a Roman numeral. |
| `from_roman` | Convert a Roman numeral to a number, with validation. |
| `convert_base` | Convert a whole number between bases 2 and 36. |
| `format_number` | Format a number for a locale: decimal, percent, currency or compact. |

## Data source

Statistics, numeral and formatting helpers implemented locally
