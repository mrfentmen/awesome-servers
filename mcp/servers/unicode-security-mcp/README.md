# unicode-security-mcp

A local-first MCP server for catching Unicode tricks before they become confusing bug reports or security incidents.

## Tools

- `analyze_text`: detect confusable characters, invisible controls, mixed scripts, and a heuristic risk level.
- `compare_identifiers`: compare two names through a small confusable skeleton.
- `get_skeleton`: normalize one identifier for local comparison.

The server never sends input to a network service. It is a review aid, not a complete Unicode Security Mechanisms implementation. The bundled mappings are intentionally conservative and should not replace platform IDNA, normalization, font, or language-specific security review.

## Run

```bash
npm install
npm run build
node dist/index.js
```
