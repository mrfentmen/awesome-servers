# Duolingo MCP

Keyless MCP server for Duolingo profiles: languages, XP, streaks, achievements.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `get_profile`: Streak, XP, courses, achievements (public profiles only).

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Uses unofficial public endpoints; only public profile data is read.


