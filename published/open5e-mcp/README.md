# Open5e (D&D 5e SRD)

Open5e reference for D&D 5e: spells, monsters and magic items from the open SRD, with stats and text - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open5e-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open5e-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open5e-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_spells` | Search 5e spells by name or text, optionally at one level. |
| `spell_detail` | One spell by slug: casting time, range, components, duration and full text. |
| `search_monsters` | Search 5e monsters by name, type or environment. |
| `monster_detail` | One monster by slug: ability scores, hit points, actions and traits. |

## Data source

Open5e API (open game content from the 5e SRD and friends)
