# Groq MCP

MCP server for Groq: fast LLM chat, model list. Needs a free API key.

## Setup

Get a key at https://console.groq.com/keys/ (free), then:

```bash
export GROQ_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `chat`: Ask a Groq-hosted LLM. Fast inference, OpenAI-compatible.
- `list_models`: Model ids available to the Groq API key.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local; prompts go to Groq's API — don't submit secrets.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `hub_model_search`
* `hub_dataset_search`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-groq-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
