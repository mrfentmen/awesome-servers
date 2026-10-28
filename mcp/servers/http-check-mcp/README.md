# HTTP Check

Check a URL live - status, timing, redirect chains and security headers, with private addresses refused, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/http-check-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "http-check-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/http-check-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `check_url` | Fetch a URL and report status, final URL, timing and key headers. |
| `check_redirects` | Walk a URL redirect chain hop by hop without following automatically. |
| `check_headers` | List which security headers a site sends and which are missing. |

## Data source

Live HTTP requests from the server. Private, loopback and link-local addresses are refused so the tool cannot be pointed at internal networks.
