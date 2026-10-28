# IEEE-754 Floats

See exactly how a number is stored as a float offline - bit layout, f32 rounding, neighbours and bit round-trips, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/float-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "float-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/float-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `float_info` | Full IEEE-754 breakdown of a number: f64 bits, sign/exponent/mantissa, f32 behaviour, rounding notes and the next representable values. |
| `bits_to_float` | Interpret hex bits as an IEEE-754 float, 32 or 64 bits wide. |
| `next_float` | Step a value to the next representable float, one or many ULPs up or down. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
