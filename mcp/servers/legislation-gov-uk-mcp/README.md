# legislation.gov.uk MCP

Fetch UK Acts of Parliament as plain text. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/legislation-gov-uk-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "legislation-gov-uk-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/legislation-gov-uk-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `act` | Read a UK Act of Parliament as plain text |

## Notes

Acts are addressed by type, year and number, e.g. ukpga/2018/12 is the Data Protection Act 2018. The API returns XML; this server strips the tags.

## Licence

MIT
