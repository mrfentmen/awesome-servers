# NVD MCP

Search the NIST National Vulnerability Database for CVEs. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/nvd-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nvd-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/nvd-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_cves` | Search CVEs by keyword |

## Notes

Without a key the NVD allows about five requests per 30 seconds. Severity filters are LOW, MEDIUM, HIGH and CRITICAL.

## Licence

MIT
