# Have I Been Pwned Breaches

The Have I Been Pwned breach catalogue: every known data breach, one breach in detail and the newest addition - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/haveibeenpwned-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "haveibeenpwned-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/haveibeenpwned-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `list_breaches` | Every breach in the catalogue, newest first, optionally one domain. |
| `breach_detail` | One breach by its account name, with data classes and counts. |
| `latest_breach` | The most recently added breach in the catalogue. |

## Data source

Have I Been Pwned API v3 (breach catalogue endpoints need no key; email checks are not offered here)
