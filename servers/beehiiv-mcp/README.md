# beehiiv MCP

MCP server for beehiiv: publications, posts, subscribers. Needs an API key.

## Setup

Get a key at Publication Settings > API, then:

```bash
export BEEHIIV_API_KEY=your_key_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_posts`: Posts with statuses and links (needs publication id).
- `find_subscriber`: Subscriber by email.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your key stays local and is only sent to beehiiv's API. All tools are read-only.
