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
