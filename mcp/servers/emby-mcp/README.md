# Emby MCP

MCP server for Emby: server info, users, libraries. Works with any instance.

## Setup

```bash
export EMBY_URL=http://localhost:8096
export EMBY_API_KEY=your_key_here  # Dashboard > Advanced > API Keys (only for users/libraries)
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `server_info`: Public name and version (no key).
- `list_users`: Users, admins, activity (needs key).
- `list_libraries`: Media libraries and types (needs key).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Credentials stay local and go only to your server.
