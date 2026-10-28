# QR Codes

Generate QR codes offline - the module matrix, an ASCII rendering or a ready SVG, versions 1 to 9 with all error levels, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/qr-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "qr-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/qr-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `qr_matrix` | The QR module matrix as rows of 0 and 1, with the best mask chosen by the standard penalty rules. |
| `qr_ascii` | Render the QR code as big ASCII blocks with the standard quiet zone, for terminals and chat. |
| `qr_svg` | A printable SVG QR code with an exact-sized viewBox and integer module scaling. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
