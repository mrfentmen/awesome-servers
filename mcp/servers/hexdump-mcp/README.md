# Hex Dump

Classic hex dumps and byte stats offline - dump text, hex or base64 input and convert between byte encodings, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/hexdump-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "hexdump-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/hexdump-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `hex_dump` | Hex dump with offsets and an ASCII column, like xxd, from text, hex or base64 input. |
| `convert_bytes` | Convert between text, hex, base64 and decimal byte lists. |
| `byte_stats` | Length, distinct values, printable ratio and entropy of a byte string, plus the first bytes read as numbers. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
