# fourchan mcp

MCP server for **4chan**, board catalogs, threads, and posts from the raw archive of internet culture.

## Tools

| Tool | What it does |
|---|---|
| `list_boards` | All boards, split into SFW / NSFW |
| `get_catalog` | Live threads for a board, sorted by reply count |
| `get_thread` | Read a thread's posts |

## Usage

```bash
npm run build && node dist/index.js
```

Example:

```
get_catalog { board: "g", limit: 10 }
get_thread { board: "g", threadNo: 109460960 }
```

Keyless (the official read only JSON API at a.4cdn.org). Post HTML is flattened to readable text; image filenames are included.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `list_boards`: List all 4chan boards with titles and SFW flags.
- `get_catalog`: Get the catalog (all live threads) for a board.
- `get_thread`: Read a thread

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `list_boards`.

<!-- paywall -->
## Premium tools

These tools need a licence key:

* `board_thread_index`
* `thread_media_gallery`

The tool bodies run on our gateway, not inside this package, so the key is what buys access. Buy one at https://buy.polar.sh/polar_cl_mrO7rS5LZxpqM7oAFFEA10i9121J240U40IIj4JRZO4 and set it in your MCP client config:

```json
"env": { "MCP_LICENSE_KEY": "polar_..." }
```

The gateway checks the key against Polar and gives every key 1,000 free premium
calls a month before per-call billing starts. Every other tool on this server
stays free.
<!-- /paywall -->
