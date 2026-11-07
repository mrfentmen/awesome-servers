# PokéAPI MCP

Pokémon species data: types, stats, abilities and sprites. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/pokeapi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pokeapi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/pokeapi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_pokemon` | Data for one Pokémon |

## Notes

Names are lowercase, e.g. pikachu. The API also covers moves, abilities, items and evolution chains.

## Licence

MIT
