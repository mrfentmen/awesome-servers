# USPS MCP

MCP server for USPS shipping, tracking, address validation, and label creation.

## Tools

- `get_rate` - Get shipping rate estimates
- `create_label` - Create shipping labels
- `track_package` - Track packages
- `validate_address` - Validate addresses
- `get_zip_code` - Look up ZIP by city/state
- `get_address_info` - Get info from ZIP code
- `schedule_pickup` - Schedule USPS pickup
- `get_service_standards` - Check delivery times

## Install

```bash
npx usps-mcp
```

## Env Vars

- `USPS_API_KEY` - USPS API key (Bearer token)
- `USPS_USERNAME` / `USPS_PASSWORD` - Basic auth
- `USPS_API_URL` - Custom API URL (default: https://api.usps.com)
