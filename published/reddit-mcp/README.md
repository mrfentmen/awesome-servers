# Reddit MCP

Keyless MCP server for Reddit search via Arctic Shift: posts and comments by subreddit and query.

Pairs well with `hacker-news-mcp`, `hn-reddit-mcp`, `lobsters-mcp`, and `fourchan-mcp`.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `search_posts`: Posts by subreddit/keywords with scores and links.
- `search_comments`: Comments by subreddit/keywords.

- `user_posts`
- `subreddit_posts`
## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required. Note: reads the open Arctic Shift archive (Reddit's own JSON blocks datacenter IPs), so very fresh posts may lag.
