# hubspot-mcp

Query HubSpot (private-app token; set HUBSPOT_ACCESS_TOKEN, Bearer): contacts, companies, deals.

## Tools

- `list_contacts` — CRM contacts with email, name and owner.
- `list_companies` — CRM companies with domain and industry.
- `list_deals` — CRM deals with amount, stage and close date.

- `list_tickets` — Service tickets.
- `list_owners` — Record owners.
- `get_contact` — Contact details.
- `get_company` — Company details.
- `get_deal` — Deal details.
- `search_contacts` — Contact lookup.
- `deal_pipelines` — Stages.

## Source

[hubspot-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/hubspot-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `legal_entity_lookup`
* `sec_company`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-hubspot-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
