# Mailgun MCP

MCP server for Mailgun: domains, stats, bounces, complaints. Needs a free API key.

## Setup

Get a key at https://www.mailgun.com/ (free), then:

```bash
export MAILGUN_API_KEY=your_key_here
export MAILGUN_REGION=us  # or eu
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_domains`: Sending domains, states, dates.
- `domain_stats`: Sent, delivered, opened, failed.
- `list_bounces`: Bounced addresses with errors.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Mailgun's API. All tools are read-only.
