# telegram-mcp

Use the Telegram Bot API (free bot; set TELEGRAM_BOT_TOKEN): bot info, send messages, read updates. Sending is real — verify chat IDs.

## Tools

- `get_me` — Bot identity: username, id and capabilities.
- `send_message` — Send a REAL message to a chat.
- `get_updates` — Incoming updates from the last 24 hours.

- `chat_info` — Chat details.
- `member_count` — Chat size.
- `file_info` — File path by ID.
- `send_photo` — Send a REAL photo message.
- `my_commands` — Registered commands.
- `delete_message` — Delete a REAL message.
- `edit_message` — Edit a REAL message.

## Source

[telegram-mcp](https://github.com/mrfentmen/premium-mcps/tree/main/servers/telegram-mcp)

<!-- paywall -->
## Premium tools

These tools need a license key:

* `message_limit_audit`
* `inline_keyboard_audit`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-telegram-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
