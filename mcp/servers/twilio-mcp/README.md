# Twilio MCP

An MCP server for Twilio communications. Send SMS, MMS, and WhatsApp messages. Make voice calls. Manage phone numbers.

## What it does

Connect your Twilio account to any MCP client. Send text messages, share images, make phone calls, and manage your phone numbers through natural language.

## Tools

- `send_sms` — Send an SMS text message to a phone number.
- `send_mms` — Send an MMS message with an image or media attachment.
- `send_whatsapp` — Send a WhatsApp message using Twilio.
- `get_message_status` — Check the delivery status of a sent message.
- `list_messages` — List recent messages with optional filters.
- `make_call` — Initiate a voice call. Requires a TwiML URL for call handling.
- `list_calls` — Recent voice calls, with from, to, duration and status.
- `list_numbers` — List your Twilio phone numbers.
- `search_numbers` — Search available phone numbers for purchase by area code.

## Authentication

Set these environment variables:

```bash
export TWILIO_ACCOUNT_SID="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
export TWILIO_AUTH_TOKEN="your-auth-token"
```

Find these in your Twilio Console dashboard.

## Install

```bash
npx twilio-mcp
```

## Claude Desktop setup

```json
{
  "mcpServers": {
    "twilio": {
      "command": "npx",
      "args": ["-y", "twilio-mcp"],
      "env": {
        "TWILIO_ACCOUNT_SID": "ACxxxxxxxx",
        "TWILIO_AUTH_TOKEN": "your-token"
      }
    }
  }
}
```

## Example usage

Ask Claude:

"Send an SMS to +14155551234 saying 'Hello from Claude' from my Twilio number"

"Send a WhatsApp message to +14155551234 with this image attached"

"What is the delivery status of message SM1234567890?"

"List my recent messages from the last day"

"Call +14155551234 and play a message using this TwiML URL"

"List my Twilio phone numbers"

"Search for available phone numbers in area code 415"

## Voice calls

To make calls, you need a TwiML URL that controls the call flow. You can use TwiML Bin in the Twilio Console or host your own TwiML. Example TwiML:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="alice">Hello, this is a call from your AI assistant.</Say>
</Response>
```

## License

MIT

<!-- paywall -->
## Premium tools

These tools need a license key:

* `incident_history`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-twilio-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
