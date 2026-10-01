# freshdesk-mcp

Query Freshdesk (set FRESHDESK_DOMAIN + FRESHDESK_API_KEY, key:X Basic): tickets, ticket details, contacts.

## Tools

- `list_tickets` — Most recent support tickets, with status and priority.
- `get_ticket` — One ticket by id, with requester and full text.
- `list_contacts` — Support contacts with email and company.

- `contact_details` — Single contact.
- `agents` — Support agents.
- `companies` — Customer companies.
- `groups` — Agent groups.
- `conversations` — Conversation on a ticket.
- `satisfaction` — CSAT ratings.
- `canned` — Reply templates.

## Source

[freshdesk-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/freshdesk-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `service_status`
* `domain_certificates`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-freshdesk-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
