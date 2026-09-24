# Pinterest MCP

MCP server for Pinterest: account, boards, pins. Needs a free Pinterest access token.

## Setup

Create an app at https://developers.pinterest.com/ to get a token, then:

```bash
export PINTEREST_ACCESS_TOKEN=your_token_here
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `my_account`: Username, profile image, website.
- `list_boards`: Names, descriptions, pin counts.
- `get_board`: One board with its pins.
- `get_pin`: Title, description, link, image.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Pinterest's API.
