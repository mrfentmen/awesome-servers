# Formbricks MCP

MCP server for Formbricks: surveys, responses. Works with any instance.

## Setup

```bash
export FORMBRICKS_URL=https://app.formbricks.com
export FORMBRICKS_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_surveys`: Surveys with statuses and counts.
- `survey_responses`: Latest answers.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your instance. All tools are read-only.
