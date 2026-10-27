# CWE

MITRE CWE weakness records: descriptions, mitigations, consequences and the weakness hierarchy - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/cwe-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "cwe-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/cwe-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_weakness` | Full record for one CWE, including mitigations and consequences. |
| `weakness_children` | More specific weaknesses that sit under a CWE. |
| `weakness_parents` | Broader weaknesses a CWE belongs to. |

## Data source

MITRE CWE API
