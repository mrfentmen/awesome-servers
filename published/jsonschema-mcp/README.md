# JSON Schema Validator

Validate JSON against a JSON Schema offline: structural validation with a clear error list, schema outlines and example instances - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jsonschema-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jsonschema-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jsonschema-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `validate_json` | Validate a JSON instance against a JSON Schema and list every error found with its path. |
| `describe_schema` | Explain a JSON Schema as a readable outline: types, required fields, bounds and nested structures. |
| `example_from_schema` | Generate a deterministic example instance that satisfies a JSON Schema, useful as a template or test fixture. |

## Data source

JSON Schema validation implemented locally (the structural core: types, required, properties, items, enum, const, numeric and string bounds, allOf/anyOf/oneOf/not)
