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

- `list_domains`: Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.
- `domain_stats`: Totals for a domain: sent, delivered, opened, failed.
- `list_bounces`: Bounced addresses for a domain with codes and errors.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to Mailgun's API. All tools are read-only.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `dkim_selector_scan`
* `mailgun_status_audit`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
