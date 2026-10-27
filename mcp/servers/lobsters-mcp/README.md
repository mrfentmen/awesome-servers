# Lobsters MCP

Lobsters: hottest and newest stories, tags, story details, user profiles — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/lobsters-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "lobsters-mcp": {
      "command": "npx",
      "args": ["-y", "@mrfentmen/lobsters-mcp"]
    }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `hottest` | Current front page |
| `newest` | Newest submissions |
| `by_tag` | Stories under one tag |
| `story_detail` | One story by short id |
| `user_info` | Profile, role and links |
| `domain_breakdown` | Top domains and active tags |

## Example

```
lobste.rs hottest (3):

1. Websites Should Be Printable [66 pts, 17 comments]
   https://brennenputh.me/blog/printable-websites/
   css, web · zk · 2026-10-26 07:02
```

## Notes

lobste.rs allows one request per second and answers throttling with a plain-text 429, which this server reports verbatim. User profiles expose identity fields only — lobste.rs publishes no karma or story counts.

## Licence

MIT
