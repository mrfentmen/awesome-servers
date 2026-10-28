# JSON Diff & Patch

Compare two JSON documents and apply RFC 6902 JSON Patch offline, with canonical re-serialisation, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/jsondiff-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "jsondiff-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/jsondiff-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `diff_json` | Structural diff between two JSON documents: added, removed and changed paths. |
| `apply_json_patch` | Apply an RFC 6902 JSON Patch (add, remove, replace, move, copy, test) to a document. |
| `canonical_json` | Re-serialise JSON deterministically, sorting keys so equal values compare byte-for-byte. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
