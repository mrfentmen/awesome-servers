# Endian & Integers

Byte order and integer tools offline - swap endianness, interpret raw bytes and inspect two's complement, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/endian-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "endian-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/endian-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `swap_endian` | Reverse the bytes of a 16, 32 or 64-bit integer and show the result as hex and decimal, signed and unsigned. |
| `interpret_bytes` | Read raw bytes as u8/i16/u32/i32/f32/u64/f64 in both endiannesses, from a given offset. |
| `int_info` | Show an integer as unsigned, signed (two's complement), hex, binary and both byte orders, with the ranges it fits. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
