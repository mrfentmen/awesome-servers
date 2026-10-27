# icanhazdadjoke

Dad jokes from icanhazdadjoke: a random one, keyword search or a lookup by joke id - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/dadjoke-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "dadjoke-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/dadjoke-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `random_dadjoke` | One random dad joke. |
| `search_dadjokes` | Search dad jokes by keyword. |
| `joke_by_id` | Look up one dad joke by its id. |

## Data source

icanhazdadjoke.com API
