# Checksums

CRC-32, CRC-32C, CRC-16 variants and Adler-32 offline, with checksum check values verified, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/crc-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "crc-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/crc-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `crc32` | CRC-32 in four flavours plus Adler-32, as hex, decimal and bytes. |
| `crc16` | CRC-16 in five common flavours (ARC, CCITT-FALSE, XMODEM, MODBUS, X-25). |
| `checksum_all` | Every supported checksum plus MD5, SHA-1 and SHA-256 in one call. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
