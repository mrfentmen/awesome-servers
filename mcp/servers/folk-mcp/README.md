# folk-mcp

Query the Folk API (free tier key; set FOLK_API_KEY, Bearer): people, person details, groups.

## Tools

- `list_people` — Contacts in the Folk workspace, newest first.
- `get_person` — One contact by id, with emails and company.
- `list_groups` — Contact groups with id and name.

## Source

[folk-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/folk-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `email_domain_dns`
* `domain_registration`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-folk-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
