# dnd5e mcp

MCP server for the **D&D 5e SRD** (dnd5eapi.co), monsters, spells, classes, equipment.

## Tools

| Tool | What it does |
|---|---|
| `get_monster` | Full stat block by index slug (`adult-red-dragon`, `goblin`…) |
| `get_spell` | Spell by index slug (`fireball`, `wish`…), full text + components |
| `list_monsters` | A, Z monster list to find valid slugs |
| `get_class` | Class overview, hit die, skill choices, starting equipment |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
get_monster { index: "adult-red-dragon" }
get_spell { index: "fireball" }
```

Keyless (community hosted SRD endpoint). Stat blocks include AC/HP/speed, all six ability scores, actions, and special abilities.
