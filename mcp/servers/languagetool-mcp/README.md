# LanguageTool MCP

Keyless MCP server for LanguageTool: grammar, spelling and style checking in 30+ languages.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `check_text`: Issues with fix suggestions (max 20000 chars, public-API fair use).
- `list_languages`: Supported language codes.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Note: checked text is sent to LanguageTool's public API — don't submit secrets.


