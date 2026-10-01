# typeform-mcp

Query Typeform (token; set TYPEFORM_TOKEN, Bearer): forms, form details, responses.

## Tools

- `list_forms` — All Typeform forms, with id and title.
- `get_form` — One form's structure: fields, logic and settings.
- `list_responses` — Recent responses to a form, newest first.

- `find_response` — Response by token.
- `account_images` — Image library.
- `account_image` — Single image.
- `themes` — All themes.
- `theme_details` — Single theme.
- `workspaces` — All workspaces.
- `create_form` — Create a REAL empty form.

## Source

[typeform-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/typeform-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `schema_lint`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-typeform-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
