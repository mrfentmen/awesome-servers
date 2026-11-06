# Go Proxy MCP

List published versions of a Go module from proxy.golang.org. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/goproxy-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "goproxy-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/goproxy-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `versions` | Published versions of a Go module |

## Notes

The Go module proxy serves the canonical version list for any public module, e.g. github.com/gin-gonic/gin.

## Licence

MIT
