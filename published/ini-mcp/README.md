# INI Files

Parse, validate, convert and generate INI configuration offline - sections, comments and quoted values, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/ini-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "ini-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/ini-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_ini` | Parse INI text into sections and keys, with inline comments handled and problems reported. |
| `ini_to_json` | Convert INI text into a JSON object keyed by section. |
| `create_ini` | Build INI text from a JSON object: scalars go at the top, nested objects become sections. |
| `validate_ini` | Check INI text for structural problems: bad lines, unterminated quotes, duplicate sections and keys. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
