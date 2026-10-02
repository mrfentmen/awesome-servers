# openapi-scout-mcp

A local-only MCP tool for quickly understanding an OpenAPI or Swagger JSON contract before writing clients, tests, mocks, or documentation.

## Tools

- `inspect_spec`: summarize version, title, servers, and operations.
- `find_operation`: inspect one operation by `operationId`.
- `list_schemas`: list component schemas or Swagger definitions.

Safety boundaries:

- Only local JSON files are accepted. URLs and network fetches are not supported.
- Files are capped at 2 MB and results are bounded.
- Examples, defaults, security schemes, and credential-like keys are redacted.
- YAML is not parsed in this release. Convert it to JSON first.

This is an inspection aid, not a complete OpenAPI validator or security scanner.

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

- `inspect_spec`: Summarize a local OpenAPI or Swagger JSON file, including operations and servers, while redacting examples, defaults, and credential-like data.
- `find_operation`: Find one operation by operationId in a local OpenAPI or Swagger JSON file.
- `list_schemas`: List local OpenAPI component schemas or Swagger definitions with sensitive example values redacted.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_spec`.
