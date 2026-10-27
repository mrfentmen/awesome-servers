# UK Parliament

UK Parliament open data: find MPs and Lords, read member profiles, and search bills with their stages - keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/uk-parliament-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "uk-parliament-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/uk-parliament-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `search_members` | Find MPs or Lords by name. |
| `member_detail` | One member by id, with party, house and constituency. |
| `search_bills` | Search bills before Parliament by title. |
| `bill_detail` | One bill by id, with sponsors, long title and stage history. |

## Data source

UK Parliament Members and Bills APIs
