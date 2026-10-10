# Invoice MCP

MCP server for generating, sending, and tracking invoices across carriers (UPS, USPS, FedEx, DHL).

## Tools

- `generate_invoice` - Generate HTML invoice from JSON data
- `convert_to_pdf` - Convert HTML invoice to PDF
- `send_invoice` - Send invoice via carrier API
- `validate_address` - Validate address for a carrier
- `create_label` - Create shipping label
- `track_shipment` - Track a shipment
- `list_carriers` - List supported carriers

## Install

```bash
npx invoice-mcp
```

## Env Vars

- `UPS_API_KEY`, `USPS_API_KEY`, `FEDEX_API_KEY`, `DHL_API_KEY`
- `PDF_TOOL` - PDF converter tool (default: wkhtmltopdf)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `vat_number_check`
* `iban_check`
* `currency_reference`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-invoice-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
