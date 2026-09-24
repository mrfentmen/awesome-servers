# Mailjet MCP

MCP server for Mailjet: contacts, messages, campaigns. Needs free API keys.

## Setup

Get keys at https://app.mailjet.com/ (free), then:

```bash
export MJ_APIKEY_PUBLIC=your_public_key
export MJ_APIKEY_PRIVATE=your_private_key
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_contacts`: Contacts with unsubscribe flags.
- `recent_messages`: Recipients, subjects, statuses.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Keys stay local and are only sent to Mailjet's API. All tools are read-only.
