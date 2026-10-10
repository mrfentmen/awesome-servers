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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_monster`: Get a D&D 5e monster by index slug (e.g.
- `get_spell`: Get a D&D 5e spell by index slug (e.g.
- `list_monsters`: List D&D 5e SRD monsters by name (a-z), useful for finding valid slugs.
- `get_class`: Get a D&D 5e class overview - hit die, proficiencies, starting equipment.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `get_monster`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `list_spells`
* `list_magic_items`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
