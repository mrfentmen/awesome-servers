# NASA EONET MCP

NASA EONET: open natural events on Earth — wildfires, storms, volcanoes, icebergs — keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y nasa-eonet-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "nasa-eonet-mcp": { "command": "npx", "args": ["-y", "nasa-eonet-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `recent_events` | Events NASA is tracking, newest first |
| `event_detail` | Full track history and source links |
| `open_events_map` | Everything open in one category with a map centre |
| `list_categories` | Every EONET category id and title |
| `list_sources` | Every agency feeding EONET |

## Example

```
Wildfire BEE HAVEN (2) (24-06), Hamilton, Florida (EONET_25590)
   Wildfires · last fix 2026-10-22 · open
   30.4952778, -82.8577778
```

## Notes

Runs on NASA's Earth Observatory Natural Event Tracker v3. Wilderness fire records are the densest part of the feed; use the open status filter to skip closed ones.

## Licence

MIT
