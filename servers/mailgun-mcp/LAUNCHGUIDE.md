# Mailgun MCP

## Tagline
MCP server for Mailgun: domains, stats, bounces, complaints. Needs a free API key.

## Description
MCP server for Mailgun: domains, stats, bounces, complaints. Needs a free API key. Published from a private commercial monorepo. Not affiliated with or endorsed by Mailgun.

## Setup Requirements
- `MAILGUN_API_KEY` (required): set in your MCP client config before use.
- `MAILGUN_REGION` (required): set in your MCP client config before use.

## Category
Marketing & Social

## Features

- List domains: Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.
- Domain stats: Totals for a domain: sent, delivered, opened, failed.
- List bounces: Bounced addresses for a domain with codes and errors.

## Getting Started

- "Ask your assistant about mailgun using this server once installed"
- Tool: list_domains — Mailgun sending domains with state and creation date. Set MAILGUN_REGION=eu for EU accounts.
- Tool: domain_stats — Totals for a domain: sent, delivered, opened, failed.
- Tool: list_bounces — Bounced addresses for a domain with codes and errors.

## Tags
mailgun, mcp, data, api

## Documentation URL
https://github.com/mrfentmen/premium-mcps/tree/main/servers/mailgun-mcp
