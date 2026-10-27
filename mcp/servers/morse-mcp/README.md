# Morse Code

Encode text to Morse and decode Morse back, covering letters, digits and punctuation - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/morse-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "morse-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/morse-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `encode_morse` | Encode text as International Morse Code. |
| `decode_morse` | Decode Morse Code back to text. |
| `morse_reference` | Look up the Morse pattern for one character or list the whole table. |

## Data source

Pure local computation, no network calls.
