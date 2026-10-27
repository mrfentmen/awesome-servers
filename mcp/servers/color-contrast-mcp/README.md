# Colour Contrast

WCAG contrast ratios, AA/AAA checks and accessible colour suggestions for hex pairs - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/color-contrast-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "color-contrast-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/color-contrast-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `contrast_ratio` | WCAG contrast ratio between two hex colours. |
| `check_wcag` | Check AA and AAA pass/fail for normal and large text. |
| `suggest_accessible` | Adjust a colour until it meets a target contrast ratio against a background. |

## Data source

Pure local computation, no network calls.
