# appwrite-mcp

Query your Appwrite instance (self-hosted or cloud; set APPWRITE_ENDPOINT + APPWRITE_PROJECT + APPWRITE_API_KEY): users, databases. Endpoints per official docs.

## Setup

Point at your Appwrite instance and create an API key in its console, then:

```bash
export APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
export APPWRITE_PROJECT=your_project_id
export APPWRITE_API_KEY=your_key
npm install
npm run build
node dist/index.js
```

Works against self-hosted Appwrite too; use your own endpoint.

## Tools

- `list_users` — Project users with email and status.
- `list_databases` — Databases in the project, with id and name.

## Source

[appwrite-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/appwrite-mcp)
