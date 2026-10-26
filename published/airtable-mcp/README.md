# airtable-mcp

Query the Airtable API (PAT; set AIRTABLE_TOKEN, Bearer): bases, tables, records.

## Setup

Create a personal access token in Airtable (Developer hub, then Personal access tokens) with access to the bases you want, then:

```bash
export AIRTABLE_TOKEN=pat...
npm install
npm run build
node dist/index.js
```

The token is sent to Airtable as a Bearer header and nowhere else.

## Tools

- `list_bases` — Airtable bases the token can access.
- `list_tables` — Tables in one base, e.g. appXXXXXXXXXXXXXX.
- `list_records` — Records in one table, with an optional max_records cap.

- `get_record` — Single record.
- `search_records` — Formula filter.
- `create_record` — Create a REAL record.
- `update_record` — Update a REAL record.
- `delete_record` — Delete a REAL record.
- `list_webhooks` — Base webhooks.
- `record_comments` — Comments on a record.

## Source

[airtable-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/airtable-mcp)
