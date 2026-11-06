# OSF MCP

Search projects on the Open Science Framework, the free research workspace. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/osf-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "osf-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/osf-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search OSF projects by title |

## Notes

OSF holds projects, registrations and preprints from research teams worldwide. This searches public projects by title.

## Licence

MIT
