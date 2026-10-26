# resend-mcp

Query the Resend API (key; set RESEND_API_KEY, Bearer): domains, domain details, email details.

## Tools

- `list_domains` — Domains verified for sending, with DKIM status.
- `get_domain` — One sending domain by id, with DNS records.
- `get_email` — One sent email by id, with delivery status.

- `list_api_keys` — Key list.
- `list_audiences` — Contact audiences.
- `get_audience` — Audience details.
- `list_contacts` — Contacts in audience.
- `list_broadcasts` — Email broadcasts.
- `get_broadcast` — Broadcast details.
- `create_contact` — Add a REAL contact.
- `add_domain` — Add a REAL sending domain.

## Source

[resend-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/resend-mcp)
