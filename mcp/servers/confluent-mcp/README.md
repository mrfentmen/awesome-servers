# Confluent MCP

MCP server for Confluent Cloud: environments, Kafka clusters. Needs an API key.

## Setup

Create a key in Cloud Console > API access (OrganizationAdmin or EnvironmentAdmin role), then:

```bash
export CONFLUENT_API_KEY=your_key
export CONFLUENT_API_SECRET=your_secret
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_environments`: Confluent Cloud environments with ids and names.
- `list_clusters`: Kafka clusters in one environment: cloud, region, availability, endpoint.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Confluent's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `list_topics`
* `list_connectors`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-confluent-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
