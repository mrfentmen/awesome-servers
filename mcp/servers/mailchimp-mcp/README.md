# mailchimp-mcp

Query Mailchimp (key; set MAILCHIMP_API_KEY, datacenter derived from key suffix): ping, lists, members, campaigns.

## Tools

- `ping` — Check that the Mailchimp API key still works.
- `list_lists` — Mailchimp audiences, with member counts.
- `list_members` — Members of one audience, with status and email.
- `list_campaigns` — Sent and scheduled campaigns, newest first.

- `list_details` — Single audience.
- `member_details` — Member by email.
- `campaign_details` — Single campaign.
- `automations` — Customer journeys.
- `segments` — Audience segments.
- `campaign_report` — Opens/clicks.

## Source

[mailchimp-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/mailchimp-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `audience_hygiene_audit`
* `email_compliance_scan`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-mailchimp-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
