# PyPI MCP

Python package metadata, versions and release files from PyPI. Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/pypi-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "pypi-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/pypi-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `get_package` | Metadata for a Python package |

## Notes

The JSON API returns the latest release plus every release ever published. Requires-python shows the supported Python versions.

## Licence

MIT
