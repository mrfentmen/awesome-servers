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

- `chat`: Ask a Groq-hosted model (OpenAI-compatible API).
- `list_models`: Available model ids.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local; prompts go to Groq's API — don't submit secrets.
