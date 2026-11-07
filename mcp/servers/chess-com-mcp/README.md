# Chess.com MCP

Chess.com player profiles, ratings and records. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/chess-com-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "chess-com-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/chess-com-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_player` | Profile for a Chess.com player |

## Notes

Usernames are case insensitive. Profiles include follower counts, country and last online time.

## Licence

MIT
