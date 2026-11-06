# JPL Horizons MCP

Solar system body positions and ephemerides from NASA JPL. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jpl-horizons-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jpl-horizons-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jpl-horizons-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `ephemeris` | Position table for a solar system body |

## Notes

Bodies are addressed by Horizons id: 499 is Mars, 599 Jupiter, 301 the Moon. The response is fixed-width text; this server returns the header and the first observation rows.

## Licence

MIT
