# Rick and Morty API

Rick and Morty universe data: characters, locations and episodes with status, origin and episode counts - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/rickandmorty-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "rickandmorty-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/rickandmorty-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_characters` | Find characters by name, status or species. |
| `character_detail` | One character by id, with origin, location, episodes and image link. |
| `search_locations` | Find locations and dimensions by name. |
| `search_episodes` | Find episodes by name or code, with air dates. |

## Data source

The Rick and Morty API
