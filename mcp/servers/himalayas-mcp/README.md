# Himalayas MCP

Remote job postings from Himalayas — company, allowed locations, employment type, seniority, salary and the apply link. Keyless.

Keyless — no signup, no API key, no environment variables.

## Install

```bash
npx -y @mrfentmen/himalayas-mcp
```

Or add it to your MCP client:

```json
{
  "mcpServers": {
    "himalayas-mcp": { "command": "npx", "args": ["-y", "@mrfentmen/himalayas-mcp"] }
  }
}
```

## Tools

| Tool | What it does |
|---|---|
| `jobs` | Recent remote postings, with paging by offset |

## Example

```
Remote jobs — 251300 total, showing 1-2

1. SAP Planon AMS L2 Support Consultant
   Principal33 Solutions · Romania · posted 2026-11-06
   https://himalayas.app/companies/principal33-solutions/jobs/...
```

## Notes

Reads the public Himalayas feed (`himalayas.app/jobs/api`). No key, no login.

The feed is a global list in its own order, not a search: there is no keyword
parameter, so this server does not pretend to search. Use `offset` to page.

Himalayas also offers cursor paging (`nextCursor`); this server uses offset
because it is simpler to page through and the feed reports `totalCount`.

`pubDate` arrives as unix seconds and is printed as a date.

## Licence

MIT
