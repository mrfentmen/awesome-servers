# OpenDota MCP

Dota 2 hero data — attributes, roles, base stats and public/pro win rates. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/opendota-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "opendota-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/opendota-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `heroes` | Heroes ranked by public picks, filterable by role and attribute |
| `hero` | One hero: base stats, roles, public win rate, pro record |

## Example

```
Dota 2 heroes — 127 matches, showing 5

1. Anti-Mage — agi, Melee, Carry/Escape/Nuker
   51.2% win rate from 628977 pubs · pro picks 7
```

## Notes

Reads the public OpenDota API (`/api/heroStats`). No key, no login.

Roles are matched against Valve's own list, e.g. `Carry`, `Support`, `Nuker`,
`Initiator`, `Disabler`, `Escape`, `Durable`, `Pusher`.

Win rates are lifetime public match numbers, not the current patch. OpenDota
does not break them down by patch on this endpoint.

The hero list is about 200 KB and is fetched on each call, so repeated calls in
one conversation cost a few seconds each.

## Licence

MIT
