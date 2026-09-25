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
