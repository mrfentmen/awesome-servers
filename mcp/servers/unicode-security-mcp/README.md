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

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `analyze_text`: Analyze text locally for Unicode confusables, mixed scripts, invisible controls, and a heuristic risk score. Input is never sent anywhere.
- `compare_identifiers`: Compare two identifiers using a Unicode-aware confusable skeleton. This is a warning aid, not a complete security proof.
- `get_skeleton`: Return a local normalized confusable skeleton for one identifier.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `analyze_text`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `confusable_family`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
