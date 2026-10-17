# gopher mcp

An MCP server that speaks the **Gopher protocol**, the pre HTTP internet, still running since 1991.

Gopher is a text menu protocol: you open a menu, it lists typed items (directories, text files, search services), and you navigate deeper. This server is a raw TCP Gopher client (port 70), no HTTP, no scraping.

## Why it's original

Nobody else has a Gopher client as an MCP tool. The AI can now surf gopherspace, Floodgap, SDF, Veronica search, and read documents that predate the web.

## Tools

| Tool | What it does |
|---|---|
| `open_menu` | Open a gopher menu and list its items (dirs, text, search, binaries) |
| `read_textfile` | Read a plain text file (gopher type 0) |
| `search_veronica` | Run a Veronica-2 search across gopherspace |

## Usage

```bash
npm run build && node dist/index.js
```

Example flow:

```
open_menu { host: "gopher.floodgap.com", selector: "/" }
search_veronica { host: "gopher.floodgap.com", query: "retro games" }
read_textfile { host: "gopher.floodgap.com", selector: "/0/floodgap/new" }
```

Default host is `gopher.floodgap.com` (Floodgap Systems, serving gopher since 1999, blocklist updated April 2026, ~81,000 Veronica matches indexed). All keyless, no auth.

## Quick start

```bash
npm install
npm run build
node dist/index.js
```

The server uses stdio, so it can be connected to Claude Desktop, Cursor, VS Code, MCP Inspector, or another compatible MCP client.

## Tools at a glance

- `open_menu`: Open a Gopher menu (directory) and list its items. The default
- `read_textfile`: Read a plain-text file from gopherspace (gopher type 0). Useful for
- `search_veronica`: Run a Gopher search (type 7) - e.g. a Veronica-2 search on

## Limits and privacy

This project is intentionally narrow. It should be treated as a practical helper, not a complete certification or security audit. Check the implementation and the returned data before using it with sensitive material. No credentials are required unless the project explicitly says otherwise.

## Try it

After building, connect the server through your MCP client. The repository root also contains `smoke-test.mjs` for projects covered by the shared harness. A typical tool call starts with `open_menu`.


