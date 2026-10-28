# XML Tools

Parse, validate and convert XML offline with a real parser - entities, CDATA, attributes and comments, keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/xml-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "xml-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/xml-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `parse_xml` | Parse XML and show the element tree with attributes and text, failing with line numbers when it is not well-formed. |
| `xml_to_json` | Convert a single-root XML document to JSON: attributes become @name, text becomes #text, repeated tags become arrays. |
| `validate_xml` | Check XML for well-formedness problems: mismatched or unclosed tags, bad entities, stray text, multiple roots. |

## Data source

Runs fully offline — all work happens inside the server with no API calls and no keys.
