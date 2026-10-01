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

These tools need a licence key:

* `vat_number_check`
* `iban_check`
* `currency_reference`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
