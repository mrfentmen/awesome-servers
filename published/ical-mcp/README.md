# iCalendar

Read, create and validate iCalendar (.ics) data offline - parse events, build RFC 5545 calendars and check them, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ical-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ical-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ical-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_ical` | Parse an .ics document: calendar headers and each event's start, end, place, attendees and repeat rule. |
| `create_event` | Build a valid single-event calendar from ISO 8601 dates, with proper escaping and RFC 5545 line folding. |
| `validate_ical` | Check an .ics document for structural problems: unbalanced components, missing properties, line endings. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
