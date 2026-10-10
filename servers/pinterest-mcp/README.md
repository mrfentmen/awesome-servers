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

- `my_account`: Your Pinterest account: username, profile image, website.
- `list_boards`: Your Pinterest boards: names, descriptions, pin counts.
- `get_board`: One Pinterest board with its pins.
- `get_pin`: One Pinterest pin: title, description, link, image.

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. Your token stays local and is only sent to Pinterest's API.

<!-- paywall -->
## Premium tools

These tools need a license key:

* `find_licensed_images`
* `image_licence`

Buy a key at https://mcp-marketplace.io/server/io-github-mrfentmen-pinterest-mcp and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "mcp_live_..." }
```

The key is checked against MCP Marketplace, cached for 24 hours, and keeps
working offline once one check has succeeded. Every other tool on this server
stays free.
<!-- /paywall -->
