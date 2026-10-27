# baserow-mcp

Query your Baserow instance (self-hosted or cloud; set BASEROW_URL + BASEROW_TOKEN, Token auth): dashboard, database tables. Endpoints per official docs.

## Setup

Create a token in Baserow (My account, then Tokens), then:

```bash
export BASEROW_TOKEN=your_token
# optional, defaults to https://api.baserow.io
export BASEROW_URL=https://api.baserow.io
npm install
npm run build
node dist/index.js
```

Works against a self-hosted Baserow too; use your own URL.

## Tools

- `get_dashboard` — Applications and databases in the workspace.
- `list_tables` — Tables inside one database id, with field counts.

## Source

[baserow-mcp](https://github.com/mrfentmen/awesome-servers)

## Licence

Every tool in this package is free: no licence key, no paid tier, no hosted gateway. Everything runs locally.
