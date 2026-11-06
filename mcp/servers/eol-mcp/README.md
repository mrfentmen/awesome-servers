# Encyclopedia of Life MCP

Look up species pages from the Encyclopedia of Life. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/eol-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "eol-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/eol-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search Encyclopedia of Life species pages |

## Notes

EOL aggregates species information from hundreds of sources. Results give the page title and the EOL page id.

## Licence

MIT
