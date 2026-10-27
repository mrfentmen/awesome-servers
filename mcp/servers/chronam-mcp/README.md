# Chronicling America

Chronicling America historical US newspapers at the Library of Congress: search scanned pages 1690-1963 by keyword, state or date, and read one page's details - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/chronam-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "chronam-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/chronam-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_pages` | Search digitised newspaper pages by keyword, optionally limited to a state or a year range. |
| `page_detail` | Details for one newspaper page by its loc.gov resource id. |
| `search_titles` | Find newspaper titles in the collection, with place of publication. |

## Data source

Library of Congress Chronicling America collection
