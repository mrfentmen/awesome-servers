# MetaCPAN MCP

Search CPAN Perl module releases. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/metacpan-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "metacpan-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/metacpan-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search` | Search CPAN releases |

## Notes

MetaCPAN indexes every CPAN release. The abstract comes from the module's POD description.

## Licence

MIT
