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

- `list_environments`: Environments with ids.
- `list_clusters`: Kafka clusters with cloud, region, endpoints.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to Confluent's API. All tools are read-only.
