# Discord MCP

Keyless MCP server for Discord: invite lookup with guild info and member counts, server widget status. No bot token needed.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `lookup_invite`: Server name, description, members, online count from any invite.
- `get_widget`: Live online count, channels, instant invite (needs widget enabled).

- `widget_members`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Only public invite/widget endpoints are used.
