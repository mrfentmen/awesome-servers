# Open Notify MCP

Where the International Space Station is right now. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/open-notify-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "open-notify-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/open-notify-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `iss_now` | Current latitude and longitude of the ISS |
| `people_in_space` | People currently in space and their craft |

## Notes

Open Notify is a small public service mirroring NASA data. Position updates every few seconds.

## Licence

MIT
