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
