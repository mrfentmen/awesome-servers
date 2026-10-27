# JSONPath

Query JSON documents with JSONPath expressions, list every path and count matches - fully local.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jsonpath-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jsonpath-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jsonpath-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `query_jsonpath` | Run a JSONPath query and return each match. |
| `list_json_paths` | List every leaf path in a JSON document. |
| `count_jsonpath` | Count how many nodes a JSONPath expression matches. |

## Data source

Pure local computation, no network calls.
