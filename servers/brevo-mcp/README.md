# Brevo MCP

MCP server for Brevo: account, contacts, email reports. Needs a free API key.

## Setup

Get a key at https://app.brevo.com/ (free), then:

```bash
export BREVO_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `account_info`: Account with plan and credits.
- `list_contacts`: Contacts with blacklist flags.
- `email_reports`: Sends, deliveries, opens, clicks, bounces.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Brevo's API. All tools are read-only.
