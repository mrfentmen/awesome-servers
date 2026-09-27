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
