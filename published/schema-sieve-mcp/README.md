# schema-sieve-mcp

Schema Sieve is a local MCP tool for understanding JSON Schema files while planning tests. It focuses on the part that usually takes the most time: finding required paths, nested constraints, unions, arrays, and likely sensitive fields before writing fixtures.

## Tools

- `inspect_schema`: summarize types, properties, required fields, constraints, composition, and references.
- `plan_fixture`: produce placeholder paths such as `<string>`, `<integer>`, and `<string:date-time>` without inventing or copying test data.

## Safety

- Only local JSON files are accepted.
- Paths are bounded by `SCHEMA_SIEVE_ROOT`, which defaults to the workspace parent when launched from the package.
- Files are capped at 2 MB and results are bounded.
- Examples, defaults, constants, and sensitive-like property names are omitted or marked as omitted.
- This is structural guidance, not a JSON Schema validator and not a security scanner.

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

- `inspect_schema`: Summarize a local JSON Schema
- `plan_fixture`: Create a privacy-safe placeholder plan for test fixture fields in a local JSON Schema. It does not fabricate or copy example data.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `inspect_schema`.

## Licence — no paywall

Every tool in this package is free: no licence key, no premium tier, no hosted
licence gateway. The paywall machinery this repo once carried (per-tool licence
checks and paid hosted endpoints) was removed repo-wide on 2026-10-17. Nothing
that this package installs or calls asks you to pay.
