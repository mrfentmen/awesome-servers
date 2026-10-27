# TOML Tools

Read, write and query TOML configuration files: parse TOML to JSON, emit TOML from JSON, and pull one value out by path. Runs locally, no network.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/toml-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "toml-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/toml-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_toml` | Parse TOML text into JSON, with line and column on any syntax error. |
| `to_toml` | Convert a JSON object into TOML text, using [tables] for nested objects. |
| `get_path` | Read one value from TOML by dotted path, e.g. project.name or servers[0].host. |

## Data source

Local TOML 1.0 parser written for this server - no network calls.
