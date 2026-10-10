# ocrspace-mcp

Run OCR.space (free key; set OCRSPACE_API_KEY, sent as apikey): text extraction from image URLs via GET or POST.

## Tools

- `parse_image_url` — Extract text from an image URL.
- `parse_image_post` — Extract text with overlay option.

## Source

[ocrspace-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/ocrspace-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `ocr_cleanup`
* `document_fields`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-ocrspace-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
