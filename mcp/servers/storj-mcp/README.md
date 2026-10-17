# Storj MCP

MCP server for Storj buckets and objects via S3. Needs access keys.

## Setup

Create S3 credentials in the Storj dashboard, then:

```bash
export STORJ_ACCESS_KEY=your_key
export STORJ_SECRET_KEY=your_secret
export STORJ_ENDPOINT=https://gateway.storjshare.io  # default
npm install
npm run build
node dist/index.js
```

Requests are SigV4-signed inline with Node's built-in crypto (no extra dependencies). The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_buckets`: Buckets.
- `list_objects`: Keys with sizes and dates (prefix filter).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local. All tools are read-only.


