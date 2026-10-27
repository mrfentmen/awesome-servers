# User Agent Parser

Parse user-agent strings into browser, engine, OS and device, and flag crawlers - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/useragent-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "useragent-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/useragent-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_user_agent` | Break a user-agent string into browser, version, engine, OS, device type and bot status. |
| `detect_bot` | Identify search engine crawlers, social previewers and automation clients. |
| `parse_user_agent_batch` | Parse up to 50 user-agent strings at once. |

## Data source

Pure local computation, no third-party calls.
